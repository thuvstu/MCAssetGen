"use client";

import React, { useState } from "react";
import {
  Boxes,
  Sparkles,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Copy,
  Activity,
  Layers,
  Wand2,
  RotateCw,
  Sun,
  Flame,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  AnimationConfig,
  AnimationType,
  FloatingItemConfig,
  FloatingItemType,
  MagicCircleConfig,
  MagicCircleStyle,
  ModelData,
  ModelElement,
  ParticleEffectConfig,
  ParticleType,
} from "@/types/model";
import { ANIMATION_TYPES, MAGIC_CIRCLE_STYLES, PARTICLE_TYPES } from "@/types/model";
import { ANIMATION_LABELS, CIRCLE_LABELS, PARTICLE_LABELS } from "@/lib/labels";
import { PART_LIBRARY } from "@/lib/parts/partLibrary";

interface ElementInspectorProps {
  model: ModelData;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (updated: ModelElement) => void;
  onAddElement: () => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onUpdateFloatingItems: (config: FloatingItemConfig) => void;
  onUpdateMagicCircle: (config: MagicCircleConfig) => void;
  onUpdateParticles: (config: ParticleEffectConfig) => void;
  onUpdateAnimations: (config: AnimationConfig) => void;
  onInsertPart?: (partId: string) => void;
  onMirrorElement?: (id: string) => void;
}

export function ElementInspector({
  model,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onDeleteElement,
  onDuplicateElement,
  onUpdateFloatingItems,
  onUpdateMagicCircle,
  onUpdateParticles,
  onUpdateAnimations,
  onInsertPart,
  onMirrorElement,
}: ElementInspectorProps) {
  const [activeTab, setActiveTab] = useState<"elements" | "decorations" | "animations">("elements");
  const [partChoice, setPartChoice] = useState(PART_LIBRARY[0].id);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    floating: true,
    circle: true,
    particles: true,
  });

  const selectedElement = model.elements.find((e) => e.id === selectedElementId);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full bg-[#16181f] border-l border-[#2d3139] text-xs text-neutral-300 select-none">
      {/* Top Tab Bar */}
      <div className="flex items-center border-b border-[#2d3139] bg-[#1a1d24]">
        <button
          onClick={() => setActiveTab("elements")}
          className={`flex-1 py-2 text-center font-medium flex items-center justify-center gap-1.5 border-b-2 transition ${
            activeTab === "elements"
              ? "border-blue-500 text-white bg-[#20242e]"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Boxes className="w-3.5 h-3.5 text-blue-400" />
          Cubes ({model.elements.length})
        </button>

        <button
          onClick={() => setActiveTab("decorations")}
          className={`flex-1 py-2 text-center font-medium flex items-center justify-center gap-1.5 border-b-2 transition ${
            activeTab === "decorations"
              ? "border-purple-500 text-white bg-[#20242e]"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Effects & Decor
        </button>

        <button
          onClick={() => setActiveTab("animations")}
          className={`flex-1 py-2 text-center font-medium flex items-center justify-center gap-1.5 border-b-2 transition ${
            activeTab === "animations"
              ? "border-emerald-500 text-white bg-[#20242e]"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          Motion
        </button>
      </div>

      {/* Tab 1: Cubes & Outliner */}
      {activeTab === "elements" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Elements list header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#262a34] bg-[#14161d]">
            <span className="font-semibold text-neutral-200 text-[11px]">Cube Hierarchy</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={onAddElement}
                title="Add New Cube"
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] transition font-medium"
              >
                <Plus className="w-3 h-3" />
                Add Cube
              </button>
            </div>
          </div>

          {onInsertPart && (
            <div className="flex items-center gap-1 border-b border-[#262a34] bg-[#14161d] px-3 py-1.5">
              <select value={partChoice} onChange={(event) => setPartChoice(event.target.value)} className="flex-1 rounded border border-[#2d3139] bg-[#101217] px-1.5 py-1 text-[11px] text-neutral-200 outline-none">
                {PART_LIBRARY.map((part) => (
                  <option key={part.id} value={part.id}>
                    [{part.category}] {part.labelJa}
                  </option>
                ))}
              </select>
              <button onClick={() => onInsertPart(partChoice)} className="flex items-center gap-1 rounded bg-fuchsia-600 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-fuchsia-500" title="選択キューブの上にパーツを挿入">
                <Plus className="h-3 w-3" />
                パーツ
              </button>
            </div>
          )}

          {/* Elements List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#22252e] max-h-52 border-b border-[#2d3139]">
            {model.elements.map((el) => {
              const isSelected = el.id === selectedElementId;
              return (
                <div
                  key={el.id}
                  onClick={() => onSelectElement(el.id)}
                  className={`flex items-center justify-between px-3 py-1.5 cursor-pointer transition ${
                    isSelected ? "bg-blue-900/40 border-l-2 border-blue-500" : "hover:bg-[#1f232d]"
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: el.color || "#3b82f6" }}
                    />
                    <span className="truncate text-[11px] font-medium text-neutral-200">
                      {el.name}
                    </span>
                    {el.emissive && (
                      <span className="px-1 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] rounded">
                        Glow
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateElement({ ...el, visible: el.visible === false ? true : false });
                      }}
                      className="p-1 hover:text-white text-neutral-400"
                      title={el.visible === false ? "Show" : "Hide"}
                    >
                      {el.visible === false ? (
                        <EyeOff className="w-3.5 h-3.5 text-neutral-500" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-neutral-300" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateElement(el.id);
                      }}
                      className="p-1 hover:text-white text-neutral-400"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteElement(el.id);
                      }}
                      className="p-1 hover:text-red-400 text-neutral-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Element Inspector Properties (if selected) */}
          {selectedElement ? (
            <div className="p-3 space-y-3 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => onMirrorElement?.(selectedElement.id)} className="rounded border border-[#2d3139] bg-[#1c1f28] py-1 text-[10.5px] text-neutral-200 hover:border-cyan-500/60" title="X軸で反転したコピーを作成 (M)">
                  ⇋ X軸ミラー複製
                </button>
                <button onClick={() => onDuplicateElement(selectedElement.id)} className="rounded border border-[#2d3139] bg-[#1c1f28] py-1 text-[10.5px] text-neutral-200 hover:border-blue-500/60" title="複製 (Ctrl+D)">
                  ⧉ 複製
                </button>
              </div>

              {/* Name & Emissive */}
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase font-semibold">
                  Cube Name & Emissive
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedElement.name}
                    onChange={(e) => onUpdateElement({ ...selectedElement, name: e.target.value })}
                    className="flex-1 bg-[#101217] border border-[#2d3139] rounded px-2 py-1 text-xs text-neutral-200 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() =>
                      onUpdateElement({ ...selectedElement, emissive: !selectedElement.emissive })
                    }
                    className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 border transition ${
                      selectedElement.emissive
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold"
                        : "bg-[#20242e] border-[#2d3139] text-neutral-400"
                    }`}
                  >
                    <Sun className="w-3 h-3" />
                    Glow
                  </button>
                </div>
              </div>

              {/* From [x, y, z] */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-neutral-400 uppercase font-semibold">
                  <span>Position From [X, Y, Z]</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["x", "y", "z"] as const).map((axis, i) => (
                    <div key={axis} className="flex items-center bg-[#101217] rounded border border-[#2d3139] px-1.5 py-0.5">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 mr-1">{axis}</span>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedElement.from[i]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const nextFrom: [number, number, number] = [...selectedElement.from];
                          nextFrom[i] = val;
                          onUpdateElement({ ...selectedElement, from: nextFrom });
                        }}
                        className="w-full bg-transparent text-xs text-neutral-200 outline-none text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* To [x, y, z] */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-neutral-400 uppercase font-semibold">
                  <span>Position To [X, Y, Z]</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["x", "y", "z"] as const).map((axis, i) => (
                    <div key={axis} className="flex items-center bg-[#101217] rounded border border-[#2d3139] px-1.5 py-0.5">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 mr-1">{axis}</span>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedElement.to[i]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const nextTo: [number, number, number] = [...selectedElement.to];
                          nextTo[i] = val;
                          onUpdateElement({ ...selectedElement, to: nextTo });
                        }}
                        className="w-full bg-transparent text-xs text-neutral-200 outline-none text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Rotation [rx, ry, rz] */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-neutral-400 uppercase font-semibold">
                  <span>Rotation Angles (deg)</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["rx", "ry", "rz"] as const).map((axis, i) => (
                    <div key={axis} className="flex items-center bg-[#101217] rounded border border-[#2d3139] px-1.5 py-0.5">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 mr-1">{axis}</span>
                      <input
                        type="number"
                        step="5"
                        value={selectedElement.rotation[i]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const nextRot: [number, number, number] = [...selectedElement.rotation];
                          nextRot[i] = val;
                          onUpdateElement({ ...selectedElement, rotation: nextRot });
                        }}
                        className="w-full bg-transparent text-xs text-neutral-200 outline-none text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Pivot Origin [ox, oy, oz] */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-neutral-400 uppercase font-semibold">
                  <span>Pivot Origin Point</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["ox", "oy", "oz"] as const).map((axis, i) => (
                    <div key={axis} className="flex items-center bg-[#101217] rounded border border-[#2d3139] px-1.5 py-0.5">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 mr-1">{axis}</span>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedElement.origin[i]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const nextOrigin: [number, number, number] = [...selectedElement.origin];
                          nextOrigin[i] = val;
                          onUpdateElement({ ...selectedElement, origin: nextOrigin });
                        }}
                        className="w-full bg-transparent text-xs text-neutral-200 outline-none text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Tint & Opacity */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase text-neutral-400">
                  <span>Tint Color / Opacity</span>
                  <span className="font-mono text-neutral-300">{(selectedElement.opacity ?? 1).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={selectedElement.color && /^#[0-9a-f]{6}$/i.test(selectedElement.color) ? selectedElement.color : "#ffffff"} onChange={(event) => onUpdateElement({ ...selectedElement, color: event.target.value })} className="h-6 w-6 cursor-pointer rounded border border-[#2d3139] bg-transparent" />
                  <input type="range" min="0.1" max="1" step="0.05" value={selectedElement.opacity ?? 1} onChange={(event) => onUpdateElement({ ...selectedElement, opacity: parseFloat(event.target.value) })} className="flex-1 cursor-pointer accent-blue-500" />
                </div>
              </div>

              {/* Inflate */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-neutral-400 uppercase font-semibold">
                  <span>Inflate (Armor Layer)</span>
                  <span className="text-neutral-300 font-mono">{(selectedElement.inflate || 0).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-0.5"
                  max="2.0"
                  step="0.1"
                  value={selectedElement.inflate || 0}
                  onChange={(e) =>
                    onUpdateElement({ ...selectedElement, inflate: parseFloat(e.target.value) })
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-neutral-500">
              <Boxes className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">Click a 3D box or select a cube above to inspect & transform</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Special Decorations & Enhancements */}
      {activeTab === "decorations" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* 1. Orbiting Floating Satellites */}
          <div className="bg-[#1a1d26] rounded-lg border border-[#2d3139] overflow-hidden">
            <button
              onClick={() => toggleGroup("floating")}
              className="w-full flex items-center justify-between p-2.5 bg-[#1f232d] hover:bg-[#252a36] transition text-left"
            >
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-neutral-200 text-xs">Floating Satellites</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={model.floatingItems.enabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdateFloatingItems({ ...model.floatingItems, enabled: e.target.checked });
                  }}
                  className="accent-purple-500 rounded cursor-pointer"
                />
                {expandedGroups.floating ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
              </div>
            </button>

            {expandedGroups.floating && (
              <div className="p-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-neutral-300">Satellite Type</span>
                  <select
                    value={model.floatingItems.type}
                    onChange={(e) =>
                      onUpdateFloatingItems({
                        ...model.floatingItems,
                        type: e.target.value as FloatingItemType,
                      })
                    }
                    className="bg-[#101217] border border-[#2d3139] rounded px-2 py-1 text-xs text-neutral-200 outline-none"
                  >
                    <option value="crystal">Crystal Gem</option>
                    <option value="shard">Arcane Shard</option>
                    <option value="rune_cube">Runic Cube</option>
                    <option value="orb">Mana Orb</option>
                    <option value="blade_ring">Blade Ring</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>Count</span>
                    <span className="font-mono text-purple-400">{model.floatingItems.count}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={model.floatingItems.count}
                    onChange={(e) =>
                      onUpdateFloatingItems({
                        ...model.floatingItems,
                        count: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>Orbit Radius</span>
                    <span className="font-mono text-purple-400">{model.floatingItems.orbitRadius}</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="18"
                    step="0.5"
                    value={model.floatingItems.orbitRadius}
                    onChange={(e) =>
                      onUpdateFloatingItems({
                        ...model.floatingItems,
                        orbitRadius: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>Orbit Speed</span>
                    <span className="font-mono text-purple-400">{model.floatingItems.orbitSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={model.floatingItems.orbitSpeed}
                    onChange={(e) =>
                      onUpdateFloatingItems({
                        ...model.floatingItems,
                        orbitSpeed: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[11px]">Glow Color</span>
                  <input
                    type="color"
                    value={model.floatingItems.color}
                    onChange={(e) =>
                      onUpdateFloatingItems({ ...model.floatingItems, color: e.target.value })
                    }
                    className="w-6 h-6 rounded cursor-pointer border border-[#2d3139] bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Magic Circle & Sigil */}
          <div className="bg-[#1a1d26] rounded-lg border border-[#2d3139] overflow-hidden">
            <button
              onClick={() => toggleGroup("circle")}
              className="w-full flex items-center justify-between p-2.5 bg-[#1f232d] hover:bg-[#252a36] transition text-left"
            >
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-neutral-200 text-xs">Magic Circle Sigil</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={model.magicCircle.enabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdateMagicCircle({ ...model.magicCircle, enabled: e.target.checked });
                  }}
                  className="accent-cyan-500 rounded cursor-pointer"
                />
                {expandedGroups.circle ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
              </div>
            </button>

            {expandedGroups.circle && (
              <div className="p-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-neutral-300">Circle Pattern</span>
                  <select
                    value={model.magicCircle.style}
                    onChange={(e) =>
                      onUpdateMagicCircle({ ...model.magicCircle, style: e.target.value as MagicCircleStyle })
                    }
                    className="bg-[#101217] border border-[#2d3139] rounded px-2 py-1 text-xs text-neutral-200 outline-none"
                  >
                    {MAGIC_CIRCLE_STYLES.map((style) => (
                      <option key={style} value={style}>
                        {CIRCLE_LABELS[style]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>Circle Radius</span>
                    <span className="font-mono text-cyan-400">{model.magicCircle.radius}</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="22"
                    step="0.5"
                    value={model.magicCircle.radius}
                    onChange={(e) =>
                      onUpdateMagicCircle({
                        ...model.magicCircle,
                        radius: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>Y-Offset Height</span>
                    <span className="font-mono text-cyan-400">{model.magicCircle.yOffset}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="30"
                    step="0.5"
                    value={model.magicCircle.yOffset}
                    onChange={(e) =>
                      onUpdateMagicCircle({
                        ...model.magicCircle,
                        yOffset: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>Tilt Angle (Degrees)</span>
                    <span className="font-mono text-cyan-400">{model.magicCircle.tiltAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={model.magicCircle.tiltAngle}
                    onChange={(e) =>
                      onUpdateMagicCircle({
                        ...model.magicCircle,
                        tiltAngle: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>Layers (多層魔法陣)</span>
                    <span className="font-mono text-cyan-400">{model.magicCircle.layers ?? 1}</span>
                  </div>
                  <input type="range" min="1" max="4" step="1" value={model.magicCircle.layers ?? 1} onChange={(event) => onUpdateMagicCircle({ ...model.magicCircle, layers: parseInt(event.target.value, 10) })} className="w-full cursor-pointer accent-cyan-500" />
                </div>

                <label className="flex items-center justify-between text-[11px]">
                  <span>刻印グリフ帯</span>
                  <input type="checkbox" checked={Boolean(model.magicCircle.glyphRing)} onChange={(event) => onUpdateMagicCircle({ ...model.magicCircle, glyphRing: event.target.checked })} className="accent-cyan-500" />
                </label>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>Rotation Speed</span>
                    <span className="font-mono text-cyan-400">{model.magicCircle.rotationSpeed.toFixed(1)}</span>
                  </div>
                  <input type="range" min="-3" max="3" step="0.1" value={model.magicCircle.rotationSpeed} onChange={(event) => onUpdateMagicCircle({ ...model.magicCircle, rotationSpeed: parseFloat(event.target.value) })} className="w-full cursor-pointer accent-cyan-500" />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[11px]">Sigil Color</span>
                  <input
                    type="color"
                    value={model.magicCircle.color}
                    onChange={(e) =>
                      onUpdateMagicCircle({ ...model.magicCircle, color: e.target.value })
                    }
                    className="w-6 h-6 rounded cursor-pointer border border-[#2d3139] bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Particle System */}
          <div className="bg-[#1a1d26] rounded-lg border border-[#2d3139] overflow-hidden">
            <button
              onClick={() => toggleGroup("particles")}
              className="w-full flex items-center justify-between p-2.5 bg-[#1f232d] hover:bg-[#252a36] transition text-left"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-neutral-200 text-xs">Particle Aura</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={model.particles.enabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdateParticles({ ...model.particles, enabled: e.target.checked });
                  }}
                  className="accent-amber-500 rounded cursor-pointer"
                />
                {expandedGroups.particles ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
              </div>
            </button>

            {expandedGroups.particles && (
              <div className="p-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-neutral-300">Element Type</span>
                  <select
                    value={model.particles.type}
                    onChange={(e) =>
                      onUpdateParticles({ ...model.particles, type: e.target.value as ParticleType })
                    }
                    className="bg-[#101217] border border-[#2d3139] rounded px-2 py-1 text-xs text-neutral-200 outline-none"
                  >
                    {PARTICLE_TYPES.filter((type) => type !== "none").map((type) => (
                      <option key={type} value={type}>
                        {PARTICLE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>Particle Density</span>
                    <span className="font-mono text-amber-400">{model.particles.density}</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="150"
                    step="5"
                    value={model.particles.density}
                    onChange={(e) =>
                      onUpdateParticles({
                        ...model.particles,
                        density: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>Spread Radius</span>
                    <span className="font-mono text-amber-400">{model.particles.spread}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="0.5"
                    value={model.particles.spread}
                    onChange={(e) =>
                      onUpdateParticles({
                        ...model.particles,
                        spread: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[11px]">Particle Colors</span>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="color"
                      value={model.particles.color}
                      onChange={(e) =>
                        onUpdateParticles({ ...model.particles, color: e.target.value })
                      }
                      className="w-6 h-6 rounded cursor-pointer border border-[#2d3139] bg-transparent"
                      title="Primary Color"
                    />
                    <input
                      type="color"
                      value={model.particles.secondaryColor || model.particles.color}
                      onChange={(e) =>
                        onUpdateParticles({ ...model.particles, secondaryColor: e.target.value })
                      }
                      className="w-6 h-6 rounded cursor-pointer border border-[#2d3139] bg-transparent"
                      title="Secondary Color"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Motion & Animation Studio */}
      {activeTab === "animations" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="bg-[#1a1d26] rounded-lg border border-[#2d3139] p-3 space-y-3">
            <span className="font-semibold text-neutral-200 text-xs block">
              Active Pose & Animation
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              {ANIMATION_TYPES.map((id) => ({ id, label: ANIMATION_LABELS[id] })).map((anim) => (
                <button
                  key={anim.id}
                  onClick={() =>
                    onUpdateAnimations({
                      ...model.animations,
                      activeAnimation: anim.id as AnimationType,
                    })
                  }
                  className={`py-2 px-2.5 rounded text-left text-xs transition border ${
                    model.animations.activeAnimation === anim.id
                      ? "bg-emerald-600/30 border-emerald-500 text-emerald-200 font-bold"
                      : "bg-[#14161d] border-[#2d3139] text-neutral-400 hover:text-white"
                  }`}
                >
                  {anim.label}
                </button>
              ))}
            </div>

            <div className="w-full h-px bg-[#2d3139] my-2" />

            {/* Animation Speed Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span>Speed Factor</span>
                <span className="font-mono text-emerald-400">{model.animations.speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={model.animations.speed}
                onChange={(e) =>
                  onUpdateAnimations({
                    ...model.animations,
                    speed: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Amplitude Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span>Motion Amplitude</span>
                <span className="font-mono text-emerald-400">
                  {model.animations.amplitude.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={model.animations.amplitude}
                onChange={(e) =>
                  onUpdateAnimations({
                    ...model.animations,
                    amplitude: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="w-full h-px bg-[#2d3139] my-2" />

            {/* Animation Layer Toggles */}
            <span className="font-semibold text-neutral-300 text-[11px] block">
              Animation Motion Layers
            </span>

            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs cursor-pointer hover:text-white">
                <span>Hover Bobbing</span>
                <input
                  type="checkbox"
                  checked={model.animations.enableHover}
                  onChange={(e) =>
                    onUpdateAnimations({
                      ...model.animations,
                      enableHover: e.target.checked,
                    })
                  }
                  className="accent-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer hover:text-white">
                <span>Orbiting Satellites</span>
                <input
                  type="checkbox"
                  checked={model.animations.enableOrbitals}
                  onChange={(e) =>
                    onUpdateAnimations({
                      ...model.animations,
                      enableOrbitals: e.target.checked,
                    })
                  }
                  className="accent-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer hover:text-white">
                <span>Magic Sigil Pulse</span>
                <input
                  type="checkbox"
                  checked={model.animations.enablePulse}
                  onChange={(e) =>
                    onUpdateAnimations({
                      ...model.animations,
                      enablePulse: e.target.checked,
                    })
                  }
                  className="accent-emerald-500"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
