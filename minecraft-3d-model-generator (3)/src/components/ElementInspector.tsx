"use client";

import React, { useState } from "react";
import type {
  CuboidElement,
  DisplayTransform,
  ModelDisplaySettings,
} from "@/db/schema";
import { syncElementFacesFromUVBox } from "@/lib/voxelGenerator";
import {
  Box,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Plus,
  RotateCw,
  Sliders,
  Trash2,
} from "lucide-react";

interface ElementInspectorProps {
  elements: CuboidElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (updated: CuboidElement) => void;
  onAddElement: (newEl: CuboidElement) => void;
  onDeleteElement: (id: string) => void;
  displaySettings: ModelDisplaySettings;
  onUpdateDisplaySettings: (next: ModelDisplaySettings) => void;
  resolution: number;
  strictMinecraftRotation: boolean;
}

type InspectorTab = "outliner" | "transform" | "display";

export default function ElementInspector({
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onDeleteElement,
  displaySettings,
  onUpdateDisplaySettings,
  resolution,
  strictMinecraftRotation,
}: ElementInspectorProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("outliner");
  const [selectedDisplaySlot, setSelectedDisplaySlot] =
    useState<keyof ModelDisplaySettings>("thirdperson_righthand");

  const selectedElement =
    elements.find((e) => e.id === selectedElementId) || null;

  const handleCreateCube = () => {
    const idx = elements.length + 1;
    const baseCube: CuboidElement = syncElementFacesFromUVBox(
      {
        id: `custom_cube_${Date.now()}`,
        name: `Custom Cube #${idx}`,
        group: "detail",
        from: [7, 8, 7],
        to: [9, 12, 9],
        origin: [8, 10, 8],
        rotation: { axis: "z", angle: 0 },
        faces: {
          north: { uv: [0, 0, 4, 4], texture: "#0" },
          south: { uv: [0, 0, 4, 4], texture: "#0" },
          east: { uv: [0, 0, 4, 4], texture: "#0" },
          west: { uv: [0, 0, 4, 4], texture: "#0" },
          up: { uv: [0, 0, 4, 4], texture: "#0" },
          down: { uv: [0, 0, 4, 4], texture: "#0" },
        },
        visible: true,
        shade: true,
        materialRole: "gem",
        uvBox: {
          x: 2,
          y: 2,
          w: 4,
          h: 4,
          d: 2,
        },
      },
      resolution
    );
    onAddElement(baseCube);
    onSelectElement(baseCube.id);
    setActiveTab("transform");
  };

  const handleDuplicateSelected = () => {
    if (!selectedElement) return;
    const dup: CuboidElement = {
      ...selectedElement,
      id: `${selectedElement.id}_copy_${Date.now()}`,
      name: `${selectedElement.name} (Copy)`,
      from: [
        selectedElement.from[0],
        selectedElement.from[1] + 1,
        selectedElement.from[2],
      ],
      to: [
        selectedElement.to[0],
        selectedElement.to[1] + 1,
        selectedElement.to[2],
      ],
    };
    onAddElement(dup);
    onSelectElement(dup.id);
  };

  const nudge = (axis: 0 | 1 | 2, delta: number) => {
    if (!selectedElement) return;
    const move = (v: [number, number, number]) => {
      const n = [...v] as [number, number, number];
      n[axis] = Number((n[axis] + delta).toFixed(2));
      return n;
    };
    onUpdateElement({
      ...selectedElement,
      from: move(selectedElement.from),
      to: move(selectedElement.to),
      origin: move(selectedElement.origin),
    });
  };

  const handleMirrorX = () => {
    if (!selectedElement) return;
    const mx = (v: number) => Number((16 - v).toFixed(2));
    const from = selectedElement.from;
    const to = selectedElement.to;
    const mirrored: CuboidElement = {
      ...selectedElement,
      id: `${selectedElement.id}_mirror_${Date.now()}`,
      name: `${selectedElement.name} (Mirror)`,
      from: [Math.min(mx(from[0]), mx(to[0])), from[1], from[2]],
      to: [Math.max(mx(from[0]), mx(to[0])), to[1], to[2]],
      origin: [mx(selectedElement.origin[0]), selectedElement.origin[1], selectedElement.origin[2]],
      rotation: {
        axis: selectedElement.rotation.axis,
        angle: selectedElement.rotation.axis === "x" ? selectedElement.rotation.angle : -selectedElement.rotation.angle,
      },
    };
    onAddElement(mirrored);
    onSelectElement(mirrored.id);
  };

  const updateCoordVec = (
    field: "from" | "to" | "origin",
    axisIdx: 0 | 1 | 2,
    val: number
  ) => {
    if (!selectedElement) return;
    const nextVec = [...selectedElement[field]] as [number, number, number];
    nextVec[axisIdx] = Number(val.toFixed(2));
    onUpdateElement({
      ...selectedElement,
      [field]: nextVec,
    });
  };

  const currentDisplayTransform: DisplayTransform =
    displaySettings[selectedDisplaySlot];

  const updateDisplayVec = (
    prop: keyof DisplayTransform,
    axisIdx: 0 | 1 | 2,
    val: number
  ) => {
    const nextVec = [...currentDisplayTransform[prop]] as [
      number,
      number,
      number,
    ];
    nextVec[axisIdx] = Number(val.toFixed(2));
    onUpdateDisplaySettings({
      ...displaySettings,
      [selectedDisplaySlot]: {
        ...currentDisplayTransform,
        [prop]: nextVec,
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#161922] text-[#F1F5F9] select-none">
      {/* Tab Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#141720] border-b border-[#262936]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("outliner")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "outliner"
                ? "bg-[#3B82F6] text-white"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Outliner ({elements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("transform")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "transform"
                ? "bg-[#3B82F6] text-white"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D座標・回転</span>
          </button>

          <button
            onClick={() => setActiveTab("display")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "display"
                ? "bg-[#3B82F6] text-white"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>装備Display</span>
          </button>
        </div>

        {/* Quick Cube Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCreateCube}
            title="新規3Dキューブを追加"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-[#10B981]/15 border border-[#10B981]/50 text-[#34D399] hover:bg-[#10B981]/25"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>追加</span>
          </button>
          {selectedElement && (
            <>
              <button
                onClick={handleDuplicateSelected}
                title="選択中のエレメントを複製"
                className="p-1 rounded bg-[#0D0E12] border border-[#262936] text-[#94A3B8] hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteElement(selectedElement.id)}
                title="選択中のエレメントを削除"
                className="p-1 rounded bg-[#0D0E12] border border-[#262936] text-[#EF4444] hover:bg-[#EF4444]/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "outliner" && (
          <div className="flex flex-col gap-1">
            {elements.map((el, index) => {
              const isSelected = el.id === selectedElementId;
              return (
                <div
                  key={el.id}
                  onClick={() => onSelectElement(el.id)}
                  className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#3B82F6]/15 border-[#3B82F6] text-white"
                      : "bg-[#0D0E12]/70 border-[#262936] text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#334155]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-[#64748B] w-4">
                      {index + 1}
                    </span>
                    <span className="truncate font-medium">{el.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Material Role Tag */}
                    <select
                      value={el.materialRole}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        onUpdateElement({
                          ...el,
                          materialRole: e.target
                            .value as CuboidElement["materialRole"],
                        });
                      }}
                      className="bg-[#161922] border border-[#262936] rounded px-1.5 py-0.5 text-[10px] font-mono text-[#94A3B8] focus:outline-none"
                    >
                      <option value="primary">刃/主体</option>
                      <option value="edge">刃先/Edge</option>
                      <option value="trim">装飾/Trim</option>
                      <option value="handle">柄/Grip</option>
                      <option value="gem">宝玉/Gem</option>
                      <option value="core">発光/Core</option>
                    </select>

                    {el.rotation.angle !== 0 && (
                      <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-[#F59E0B]/15 text-[#FBBF24]">
                        {el.rotation.axis.toUpperCase()}:{el.rotation.angle}°
                      </span>
                    )}
                    {el.motion && (
                      <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-[#8B5CF6]/20 text-[#C084FC]">
                        {el.motion.orbitTurns > 0 ? "+" : ""}
                        {el.motion.orbitTurns}周
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateElement({ ...el, visible: !el.visible });
                      }}
                      className="p-0.5 text-[#94A3B8] hover:text-white"
                    >
                      {el.visible ? (
                        <Eye className="w-3.5 h-3.5 text-[#10B981]" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-[#64748B]" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "transform" && (
          <div>
            {selectedElement ? (
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={selectedElement.name}
                    onChange={(e) =>
                      onUpdateElement({
                        ...selectedElement,
                        name: e.target.value,
                      })
                    }
                    className="flex-1 bg-[#0D0E12] border border-[#262936] rounded px-2.5 py-1 text-xs font-medium text-white focus:border-[#3B82F6] focus:outline-none"
                  />
                  <span className="font-mono text-[11px] text-[#64748B]">
                    Group: {selectedElement.group.toUpperCase()}
                  </span>
                </div>

                {/* From / To / Origin XYZ Numeric Inputs */}
                {(
                  [
                    { key: "from", label: "始点座標 From [X, Y, Z]" },
                    { key: "to", label: "終点座標 To [X, Y, Z]" },
                    { key: "origin", label: "回転ピボット Origin [X, Y, Z]" },
                  ] as const
                ).map((vecSpec) => (
                  <div key={vecSpec.key} className="flex flex-col gap-1">
                    <span className="text-[11px] text-[#94A3B8] font-medium">
                      {vecSpec.label}
                    </span>
                    <div className="grid grid-cols-3 gap-2 font-mono">
                      {(
                        [
                          { idx: 0, axis: "X", color: "text-[#EF4444]" },
                          { idx: 1, axis: "Y", color: "text-[#10B981]" },
                          { idx: 2, axis: "Z", color: "text-[#3B82F6]" },
                        ] as const
                      ).map((ax) => (
                        <label
                          key={ax.axis}
                          className="flex items-center justify-between bg-[#0D0E12] border border-[#262936] rounded px-2 py-1"
                        >
                          <span className={`font-bold ${ax.color}`}>
                            {ax.axis}
                          </span>
                          <input
                            type="number"
                            step="0.25"
                            value={selectedElement[vecSpec.key][ax.idx]}
                            onChange={(e) =>
                              updateCoordVec(
                                vecSpec.key,
                                ax.idx,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-14 text-right bg-transparent text-[#F1F5F9] focus:outline-none"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Rotation Axis & Minecraft 22.5° Snap Controls */}
                <div className="flex flex-col gap-1.5 pt-1 border-t border-[#262936]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] text-[#94A3B8] font-medium">
                      <RotateCw className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>エレメント回転 (Minecraft 22.5°刻み対応)</span>
                    </span>
                    <div className="flex items-center gap-1 font-mono">
                      {(["x", "y", "z"] as const).map((ax) => (
                        <button
                          key={ax}
                          onClick={() =>
                            onUpdateElement({
                              ...selectedElement,
                              rotation: {
                                ...selectedElement.rotation,
                                axis: ax,
                              },
                            })
                          }
                          className={`px-2 py-0.5 rounded text-[11px] uppercase border ${
                            selectedElement.rotation.axis === ax
                              ? "bg-[#3B82F6] border-[#3B82F6] text-white"
                              : "bg-[#0D0E12] border-[#262936] text-[#94A3B8]"
                          }`}
                        >
                          {ax}軸
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Snap Buttons (-45, -22.5, 0, +22.5, +45) */}
                  <div className="grid grid-cols-5 gap-1.5 font-mono text-[11px]">
                    {([-45, -22.5, 0, 22.5, 45] as const).map((ang) => (
                      <button
                        key={ang}
                        onClick={() =>
                          onUpdateElement({
                            ...selectedElement,
                            rotation: {
                              ...selectedElement.rotation,
                              angle: ang,
                            },
                          })
                        }
                        className={`py-1 rounded border transition-colors ${
                          selectedElement.rotation.angle === ang
                            ? "bg-[#F59E0B]/20 border-[#F59E0B] text-[#FBBF24] font-bold"
                            : "bg-[#0D0E12] border-[#262936] text-[#94A3B8] hover:text-white"
                        }`}
                      >
                        {ang > 0 ? `+${ang}°` : `${ang}°`}
                      </button>
                    ))}
                  </div>

                  {!strictMinecraftRotation && (
                    <input
                      type="range"
                      min={-45}
                      max={45}
                      step={0.5}
                      value={selectedElement.rotation.angle}
                      onChange={(e) =>
                        onUpdateElement({
                          ...selectedElement,
                          rotation: {
                            ...selectedElement.rotation,
                            angle: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full accent-[#3B82F6]"
                    />
                  )}
                </div>

                {/* Nudge & mirror tools */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-[#262936]">
                  <span className="text-[11px] text-[#94A3B8] font-medium">微調整 (0.5 vxl) / ミラー</span>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                    {([0, 1, 2] as const).map((axis) => (
                      <div key={axis} className="flex items-center justify-between bg-[#0D0E12] border border-[#262936] rounded px-1 py-0.5">
                        <button
                          onClick={() => nudge(axis, -0.5)}
                          className="px-1.5 text-[#94A3B8] hover:text-white"
                        >
                          −
                        </button>
                        <span className={axis === 0 ? "text-[#EF4444]" : axis === 1 ? "text-[#10B981]" : "text-[#3B82F6]"}>
                          {"XYZ"[axis]}
                        </span>
                        <button
                          onClick={() => nudge(axis, 0.5)}
                          className="px-1.5 text-[#94A3B8] hover:text-white"
                        >
                          ＋
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleMirrorX}
                    className="w-full py-1 rounded text-[11px] bg-[#0D0E12] border border-[#262936] text-[#94A3B8] hover:text-white hover:border-[#3B82F6]"
                  >
                    X軸ミラー複製（左右対称パーツを作る）
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-36 flex flex-col items-center justify-center text-center text-xs text-[#64748B] gap-2">
                <Box className="w-6 h-6 text-[#3B82F6]/60" />
                <p>
                  3DビューポートまたはOutlinerからパーツをクリックすると、
                  <br />
                  精密なボクセル座標・ピボット回転を編集できます。
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "display" && (
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#94A3B8]">対象スロット:</span>
              <select
                value={selectedDisplaySlot}
                onChange={(e) =>
                  setSelectedDisplaySlot(
                    e.target.value as keyof ModelDisplaySettings
                  )
                }
                className="bg-[#0D0E12] border border-[#262936] rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none"
              >
                <option value="thirdperson_righthand">
                  thirdperson_righthand (三人称・右手)
                </option>
                <option value="thirdperson_lefthand">
                  thirdperson_lefthand (三人称・左手)
                </option>
                <option value="firstperson_righthand">
                  firstperson_righthand (一人称・右手)
                </option>
                <option value="firstperson_lefthand">
                  firstperson_lefthand (一人称・左手)
                </option>
                <option value="gui">gui (インベントリアイコン)</option>
                <option value="ground">ground (ドロップ状態)</option>
                <option value="fixed">fixed (額縁展示)</option>
              </select>
            </div>

            {(
              [
                { key: "rotation", label: "回転 Rotation (deg) [X, Y, Z]" },
                { key: "translation", label: "位置オフセット Translation [X, Y, Z]" },
                { key: "scale", label: "スケール倍率 Scale [X, Y, Z]" },
              ] as const
            ).map((field) => (
              <div key={field.key} className="flex flex-col gap-1">
                <span className="text-[11px] text-[#94A3B8]">{field.label}</span>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  {(
                    [
                      { idx: 0, axis: "X", color: "text-[#EF4444]" },
                      { idx: 1, axis: "Y", color: "text-[#10B981]" },
                      { idx: 2, axis: "Z", color: "text-[#3B82F6]" },
                    ] as const
                  ).map((ax) => (
                    <label
                      key={ax.axis}
                      className="flex items-center justify-between bg-[#0D0E12] border border-[#262936] rounded px-2 py-1"
                    >
                      <span className={`font-bold ${ax.color}`}>{ax.axis}</span>
                      <input
                        type="number"
                        step={field.key === "scale" ? "0.05" : "1"}
                        value={currentDisplayTransform[field.key][ax.idx]}
                        onChange={(e) =>
                          updateDisplayVec(
                            field.key,
                            ax.idx,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-14 text-right bg-transparent text-[#F1F5F9] focus:outline-none"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
