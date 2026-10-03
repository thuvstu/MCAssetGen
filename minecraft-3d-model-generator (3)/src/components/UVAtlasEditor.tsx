"use client";

import React, { useEffect, useRef, useState } from "react";
import type { CuboidElement } from "@/db/schema";
import {
  MATERIAL_PALETTES,
  syncElementFacesFromUVBox,
  type MaterialPresetId,
} from "@/lib/voxelGenerator";
import {
  Brush,
  Download,
  FlipHorizontal,
  PaintBucket,
  Blend,
  Eye,
  Move,
  Pipette,
  RefreshCw,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface UVAtlasEditorProps {
  elements: CuboidElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (updated: CuboidElement) => void;
  textureDataUrl: string;
  onUpdateTextureDataUrl: (dataUrl: string) => void;
  onRegenerateProceduralAtlas: () => void;
  resolution: number;
  materialPreset: MaterialPresetId;
  modelSlug: string;
}

type ToolMode = "select_uv" | "brush" | "eyedropper" | "bucket";

const GROUP_COLORS: Record<CuboidElement["group"], string> = {
  blade: "#22d3ee",
  guard: "#f59e0b",
  grip: "#10b981",
  pommel: "#c084fc",
  detail: "#f43f5e",
  head: "#38bdf8",
  shaft: "#a3e635",
  float: "#e879f9",
};

export default function UVAtlasEditor({
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  textureDataUrl,
  onUpdateTextureDataUrl,
  onRegenerateProceduralAtlas,
  resolution,
  materialPreset,
  modelSlug,
}: UVAtlasEditorProps) {
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [tool, setTool] = useState<ToolMode>("select_uv");
  const [brushColor, setBrushColor] = useState<string>("#22d3ee");
  const [secondColor, setSecondColor] = useState<string>("#0e7490");
  const [mirrorPaint, setMirrorPaint] = useState<boolean>(false);
  const [showUVBoxes, setShowUVBoxes] = useState<boolean>(true);
  const [showPixelGrid, setShowPixelGrid] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);
  const [hoverPixel, setHoverPixel] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isPainting, setIsPainting] = useState<boolean>(false);
  const [draggingUV, setDraggingUV] = useState<{
    elementId: string;
    startPx: number;
    startPy: number;
    origX: number;
    origY: number;
  } | null>(null);

  const palette = MATERIAL_PALETTES[materialPreset] || MATERIAL_PALETTES.diamond;
  const paletteSwatches = [
    palette.edgeHighlight,
    palette.primaryLight,
    palette.primaryBase,
    palette.primaryDark,
    palette.trimLight,
    palette.trimBase,
    palette.trimDark,
    palette.handleLight,
    palette.handleBase,
    palette.gemLight,
    palette.gemBase,
    palette.coreGlow,
  ];

  // Sync offscreen canvas whenever textureDataUrl or resolution changes
  useEffect(() => {
    const off = document.createElement("canvas");
    off.width = resolution;
    off.height = resolution;
    offscreenCanvasRef.current = off;

    if (!textureDataUrl) {
      renderDisplayCanvas();
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = off.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, resolution, resolution);
        ctx.drawImage(img, 0, 0, resolution, resolution);
      }
      renderDisplayCanvas();
    };
    img.src = textureDataUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textureDataUrl, resolution]);

  // Re-render overlay whenever selection, hover, UV boxes, or grid toggle changes
  useEffect(() => {
    renderDisplayCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    elements,
    selectedElementId,
    showUVBoxes,
    showPixelGrid,
    hoverPixel,
    resolution,
  ]);

  const renderDisplayCanvas = () => {
    const canvas = displayCanvasRef.current;
    const off = offscreenCanvasRef.current;
    if (!canvas) return;

    const size = 384; // High-DPI display size for crisp overlay lines
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = size;
      canvas.height = size;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = size / resolution;

    // 1. Checkerboard background
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#181B24" : "#202431";
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    // 2. Draw pixel-art texture from offscreen canvas
    if (off) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, size, size);
    }

    // 3. Draw 1px grid lines
    if (showPixelGrid && resolution <= 64) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= resolution; i++) {
        const pos = Math.floor(i * scale) + 0.5;
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, size);
        ctx.moveTo(0, pos);
        ctx.lineTo(size, pos);
      }
      ctx.stroke();
    }

    // 4. Draw UV Island Boxes for each cuboid element
    if (showUVBoxes) {
      elements.forEach((el) => {
        if (!el.visible) return;
        const { x, y, w, h } = el.uvBox;
        const isSel = el.id === selectedElementId;
        const color = GROUP_COLORS[el.group] || "#38bdf8";

        ctx.save();
        ctx.strokeStyle = isSel ? "#ffffff" : color;
        ctx.lineWidth = isSel ? 2.5 : 1.25;
        if (!isSel) {
          ctx.setLineDash([3, 2]);
        }

        const rx = x * scale + 1;
        const ry = y * scale + 1;
        const rw = w * scale - 2;
        const rh = h * scale - 2;

        ctx.strokeRect(rx, ry, rw, rh);

        if (isSel) {
          ctx.fillStyle = "rgba(59, 130, 246, 0.18)";
          ctx.fillRect(rx, ry, rw, rh);

          // Label tag
          ctx.fillStyle = "#0D0E12";
          ctx.fillRect(rx, Math.max(0, ry - 15), Math.min(rw + 40, 120), 14);
          ctx.fillStyle = "#60A5FA";
          ctx.font = "bold 10px monospace";
          ctx.fillText(el.name.slice(0, 16), rx + 3, Math.max(10, ry - 4));
        }
        ctx.restore();
      });
    }

    // 5. Hovered Pixel Cursor Highlight
    if (hoverPixel) {
      ctx.strokeStyle =
        tool === "brush"
          ? brushColor
          : tool === "eyedropper"
            ? "#fde047"
            : "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        hoverPixel.x * scale + 1,
        hoverPixel.y * scale + 1,
        scale - 2,
        scale - 2
      );
    }
  };

  const getPixelCoords = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return {
      x: Math.min(resolution - 1, Math.floor(relX * resolution)),
      y: Math.min(resolution - 1, Math.floor(relY * resolution)),
    };
  };

  const paintAt = (px: number, py: number) => {
    const off = offscreenCanvasRef.current;
    if (!off) return;
    const ctx = off.getContext("2d");
    if (!ctx) return;

    if (tool === "eyedropper") {
      const data = ctx.getImageData(px, py, 1, 1).data;
      const hex =
        "#" +
        [data[0], data[1], data[2]]
          .map((v) => v.toString(16).padStart(2, "0"))
          .join("");
      setBrushColor(hex);
      setTool("brush");
      return;
    }

    if (tool === "brush") {
      ctx.fillStyle = brushColor;
      ctx.fillRect(px, py, 1, 1);
      if (mirrorPaint) ctx.fillRect(resolution - 1 - px, py, 1, 1);
      renderDisplayCanvas();
      return;
    }

    if (tool === "bucket") {
      floodFill(ctx, px, py, brushColor);
      if (mirrorPaint) floodFill(ctx, resolution - 1 - px, py, brushColor);
      renderDisplayCanvas();
    }
  };

  /** 4-connected flood fill on the offscreen atlas (exact color match). */
  const floodFill = (ctx: CanvasRenderingContext2D, sx: number, sy: number, hex: string) => {
    const img = ctx.getImageData(0, 0, resolution, resolution);
    const data = img.data;
    const idx = (x: number, y: number) => (y * resolution + x) * 4;
    const start = idx(sx, sy);
    const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
    const n = parseInt(hex.replace("#", ""), 16);
    const fill = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
    if (target.every((v, i) => v === fill[i])) return;
    const stack: Array<[number, number]> = [[sx, sy]];
    while (stack.length > 0) {
      const [x, y] = stack.pop() as [number, number];
      if (x < 0 || y < 0 || x >= resolution || y >= resolution) continue;
      const i = idx(x, y);
      if (data[i] !== target[0] || data[i + 1] !== target[1] || data[i + 2] !== target[2] || data[i + 3] !== target[3]) continue;
      data[i] = fill[0];
      data[i + 1] = fill[1];
      data[i + 2] = fill[2];
      data[i + 3] = fill[3];
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    ctx.putImageData(img, 0, 0);
  };

  /** Fill the selected UV island with a vertical brush→second color gradient. */
  const applyIslandGradient = () => {
    const off = offscreenCanvasRef.current;
    const target = elements.find((el) => el.id === selectedElementId);
    if (!off || !target) return;
    const ctx = off.getContext("2d");
    if (!ctx) return;
    const { x, y, w, h } = target.uvBox;
    const a = parseInt(brushColor.replace("#", ""), 16);
    const b = parseInt(secondColor.replace("#", ""), 16);
    for (let py = 0; py < h; py++) {
      const t = h > 1 ? py / (h - 1) : 0;
      const r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t);
      const g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t);
      const bl = Math.round((a & 255) * (1 - t) + (b & 255) * t);
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.fillRect(x, y + py, w, 1);
    }
    renderDisplayCanvas();
    commitOffscreenTexture();
  };

  const commitOffscreenTexture = () => {
    const off = offscreenCanvasRef.current;
    if (!off) return;
    onUpdateTextureDataUrl(off.toDataURL("image/png"));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: px, y: py } = getPixelCoords(e);

    if (tool === "select_uv") {
      // Find clicked UV island (prioritize currently selected or smallest box)
      const hit = [...elements]
        .reverse()
        .find(
          (el) =>
            el.visible &&
            px >= el.uvBox.x &&
            px < el.uvBox.x + el.uvBox.w &&
            py >= el.uvBox.y &&
            py < el.uvBox.y + el.uvBox.h
        );

      if (hit) {
        onSelectElement(hit.id);
        setDraggingUV({
          elementId: hit.id,
          startPx: px,
          startPy: py,
          origX: hit.uvBox.x,
          origY: hit.uvBox.y,
        });
      } else {
        onSelectElement(null);
      }
      return;
    }

    setIsPainting(true);
    paintAt(px, py);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: px, y: py } = getPixelCoords(e);
    setHoverPixel({ x: px, y: py });

    if (draggingUV && tool === "select_uv") {
      const target = elements.find((el) => el.id === draggingUV.elementId);
      if (target) {
        const dx = px - draggingUV.startPx;
        const dy = py - draggingUV.startPy;
        const nextX = Math.max(
          0,
          Math.min(resolution - target.uvBox.w, draggingUV.origX + dx)
        );
        const nextY = Math.max(
          0,
          Math.min(resolution - target.uvBox.h, draggingUV.origY + dy)
        );

        if (nextX !== target.uvBox.x || nextY !== target.uvBox.y) {
          const updated = syncElementFacesFromUVBox(
            {
              ...target,
              uvBox: {
                ...target.uvBox,
                x: nextX,
                y: nextY,
              },
            },
            resolution
          );
          onUpdateElement(updated);
        }
      }
      return;
    }

    if (isPainting && tool === "brush") {
      paintAt(px, py);
    }
  };

  const handleMouseUp = () => {
    if (isPainting) {
      setIsPainting(false);
      commitOffscreenTexture();
    }
    if (draggingUV) {
      setDraggingUV(null);
    }
  };

  const handleUploadCustomPNG = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = resolution;
        canvas.height = resolution;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, resolution, resolution);
          onUpdateTextureDataUrl(canvas.toDataURL("image/png"));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDownloadPNG = () => {
    if (!textureDataUrl) return;
    const link = document.createElement("a");
    link.href = textureDataUrl;
    link.download = `${modelSlug || "voxelforge_atlas"}.png`;
    link.click();
  };

  const selectedElement =
    elements.find((e) => e.id === selectedElementId) || null;

  return (
    <div className="flex flex-col h-full bg-[#161922] text-[#F1F5F9] select-none">
      {/* Top UV Studio Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 bg-[#141720] border-b border-[#262936]">
        <div className="flex items-center gap-1 bg-[#0D0E12] p-0.5 rounded border border-[#262936]">
          <button
            onClick={() => setTool("select_uv")}
            title="UVアイランド選択＆ドラッグ移動"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              tool === "select_uv"
                ? "bg-[#3B82F6] text-white"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>UV選択・移動</span>
          </button>
          <button
            onClick={() => setTool("brush")}
            title="1px ドット絵ブラシ"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              tool === "brush"
                ? "bg-[#3B82F6] text-white"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <Brush className="w-3.5 h-3.5" />
            <span>1px ペイント</span>
          </button>
          <button
            onClick={() => setTool("eyedropper")}
            title="スポイトツール"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              tool === "eyedropper"
                ? "bg-[#F59E0B] text-black"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <Pipette className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool("bucket")}
            title="塗りつぶし（同色領域）"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              tool === "bucket" ? "bg-[#3B82F6] text-white" : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <PaintBucket className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMirrorPaint((v) => !v)}
            title="左右ミラー描画"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              mirrorPaint ? "bg-[#10B981] text-black" : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* UV Overlay & Upload Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowUVBoxes((v) => !v)}
            title="UVアイランド枠の表示切替"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${
              showUVBoxes
                ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#60A5FA]"
                : "bg-[#0D0E12] border-[#262936] text-[#94A3B8]"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>UV枠</span>
          </button>

          <button
            onClick={onRegenerateProceduralAtlas}
            title="現在の材質＆シェーディングでUVアトラスを再描画"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-[#0D0E12] border border-[#262936] text-[#94A3B8] hover:text-white hover:border-[#3B82F6]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>自動描画</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleUploadCustomPNG}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="外部のUVアトラスPNG画像を読み込む"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-[#0D0E12] border border-[#262936] text-[#94A3B8] hover:text-white hover:border-[#10B981]"
          >
            <Upload className="w-3.5 h-3.5 text-[#10B981]" />
            <span>PNG読込</span>
          </button>

          <button
            onClick={handleDownloadPNG}
            title="UVアトラスPNG単体を保存"
            className="p-1 rounded bg-[#0D0E12] border border-[#262936] text-[#94A3B8] hover:text-white"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Color Swatch Bar (Visible when painting or inspecting) */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#11131A] border-b border-[#262936]">
        <div className="flex items-center gap-1 flex-wrap">
          {paletteSwatches.map((hex, i) => (
            <button
              key={`${hex}-${i}`}
              onClick={() => {
                setBrushColor(hex);
                setTool("brush");
              }}
              style={{ backgroundColor: hex }}
              className={`w-4 h-4 rounded-sm border transition-transform ${
                brushColor.toLowerCase() === hex.toLowerCase()
                  ? "border-white scale-125 z-10 shadow"
                  : "border-black/50 hover:scale-110"
              }`}
              title={`カラー: ${hex}`}
            />
          ))}
          <input
            type="color"
            value={brushColor}
            onChange={(e) => {
              setBrushColor(e.target.value);
              setTool("brush");
            }}
            className="w-5 h-5 bg-transparent border-0 cursor-pointer ml-1"
            title="カスタムカラー選択"
          />
          <input
            type="color"
            value={secondColor}
            onChange={(e) => setSecondColor(e.target.value)}
            className="w-5 h-5 bg-transparent border-0 cursor-pointer"
            title="グラデーション終点色"
          />
          <button
            onClick={applyIslandGradient}
            disabled={!selectedElementId}
            title="選択中のUVアイランドを2色グラデーションで塗る"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border border-[#262936] text-[#94A3B8] hover:text-white disabled:opacity-40"
          >
            <Blend className="w-3 h-3" />
            <span>島グラデ</span>
          </button>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-[#94A3B8]">
          <button
            onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.2).toFixed(1)))}
            className="p-0.5 hover:text-white"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2.0, +(z + 0.2).toFixed(1)))}
            className="p-0.5 hover:text-white"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center Interactive 2D UV Canvas Area */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-3 bg-[#0D0E12]">
        <div
          className="relative border border-[#262936] shadow-xl bg-[#141720]"
          style={{
            width: `${Math.round(250 * zoom)}px`,
            height: `${Math.round(250 * zoom)}px`,
          }}
        >
          <canvas
            ref={displayCanvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setHoverPixel(null);
              handleMouseUp();
            }}
            className="w-full h-full block cursor-crosshair"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>

      {/* Bottom Selected UV Island Coordinate Inspector */}
      <div className="px-3 py-2 bg-[#141720] border-t border-[#262936] text-xs">
        {selectedElement ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#60A5FA] truncate">
                UV対象: {selectedElement.name}
              </span>
              <span className="font-mono text-[11px] text-[#94A3B8]">
                MC UV: [{selectedElement.faces.north.uv.join(", ")}]
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
              {(
                [
                  { key: "x", label: "U (X)" },
                  { key: "y", label: "V (Y)" },
                  { key: "w", label: "幅 (W)" },
                  { key: "h", label: "高 (H)" },
                ] as const
              ).map((field) => (
                <label
                  key={field.key}
                  className="flex items-center justify-between bg-[#0D0E12] px-2 py-1 rounded border border-[#262936]"
                >
                  <span className="text-[#94A3B8]">{field.label}</span>
                  <input
                    type="number"
                    min={field.key === "w" || field.key === "h" ? 1 : 0}
                    max={resolution}
                    value={selectedElement.uvBox[field.key]}
                    onChange={(e) => {
                      const val = Math.max(
                        0,
                        Math.min(resolution, Number(e.target.value) || 0)
                      );
                      const updated = syncElementFacesFromUVBox(
                        {
                          ...selectedElement,
                          uvBox: {
                            ...selectedElement.uvBox,
                            [field.key]: val,
                          },
                        },
                        resolution
                      );
                      onUpdateElement(updated);
                    }}
                    className="w-10 text-right bg-transparent text-[#F1F5F9] focus:outline-none"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
            <span>
              {hoverPixel
                ? `Cursor: (${hoverPixel.x}, ${hoverPixel.y})px / MC UV: (${(
                    (hoverPixel.x / resolution) *
                    16
                  ).toFixed(1)}, ${((hoverPixel.y / resolution) * 16).toFixed(1)})`
                : "UV枠をクリックしてドラッグ移動、またはブラシで直接ピクセル編集"}
            </span>
            <span className="text-[#10B981]">
              {resolution}×{resolution} Atlas
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
