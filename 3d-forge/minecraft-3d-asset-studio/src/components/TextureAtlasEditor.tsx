"use client";

import { ChangeEvent, PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Eraser,
  Grid3X3,
  Layers,
  PaintBucket,
    Paintbrush,
  Palette,
  Pipette,
  Redo2,
  Sparkles,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useTextureHistory } from "@/hooks/useTextureHistory";
import { applyGradient, BLEND_LABELS, BLEND_MODES, BlendMode, DEFAULT_GRADIENT, GRADIENT_LABELS, GRADIENT_PRESETS, GRADIENT_TYPES, GradientConfig, GradientType, PixelRect } from "@/lib/texture/gradients";
import { generateProceduralAtlas, PALETTES } from "@/lib/generators/textureBaker";
import { ColorPalette, DIRECTIONS, ModelData, ModelElement, ModelTheme, TEXTURE_RESOLUTIONS, TextureResolution } from "@/types/model";

type GradientTarget = "all" | "blade" | "guard" | "gem" | "rune" | "selected";
const GRADIENT_TARGETS: Array<{ id: GradientTarget; label: string }> = [
  { id: "all", label: "アトラス全体" },
  { id: "blade", label: "刃 (左上)" },
  { id: "guard", label: "柄 (右上)" },
  { id: "gem", label: "宝石 (左下)" },
  { id: "rune", label: "ルーン (右下)" },
  { id: "selected", label: "選択キューブの面" },
];

type TextureTool = "pencil" | "eraser" | "picker" | "bucket" | "dither";

interface TextureAtlasEditorProps {
  model: ModelData;
  textureDataUrl: string;
  onUpdateTexture: (newUrl: string) => void;
  onUpdateResolution: (res: TextureResolution) => void;
  onSelectPalette: (palette: ColorPalette) => void;
  selectedElement?: ModelElement | null;
}

function toRgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function fillCanvasRegion(context: CanvasRenderingContext2D, width: number, height: number, x: number, y: number, color: string) {
  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;
  const sourceIndex = (y * width + x) * 4;
  const source = [data[sourceIndex], data[sourceIndex + 1], data[sourceIndex + 2], data[sourceIndex + 3]];
  const [red, green, blue] = toRgb(color);

  if (source[0] === red && source[1] === green && source[2] === blue && source[3] === 255) return;

  const queue: [number, number][] = [[x, y]];
  const visited = new Uint8Array(width * height);

  while (queue.length > 0) {
    const [currentX, currentY] = queue.pop()!;
    const pixelIndex = currentY * width + currentX;
    if (visited[pixelIndex]) continue;
    visited[pixelIndex] = 1;

    const dataIndex = pixelIndex * 4;
    const matchesSource =
      data[dataIndex] === source[0] &&
      data[dataIndex + 1] === source[1] &&
      data[dataIndex + 2] === source[2] &&
      data[dataIndex + 3] === source[3];

    if (!matchesSource) continue;

    data[dataIndex] = red;
    data[dataIndex + 1] = green;
    data[dataIndex + 2] = blue;
    data[dataIndex + 3] = 255;

    if (currentX > 0) queue.push([currentX - 1, currentY]);
    if (currentX < width - 1) queue.push([currentX + 1, currentY]);
    if (currentY > 0) queue.push([currentX, currentY - 1]);
    if (currentY < height - 1) queue.push([currentX, currentY + 1]);
  }

  context.putImageData(imageData, 0, 0);
}

export function TextureAtlasEditor({
  model,
  textureDataUrl,
  onUpdateTexture,
  onUpdateResolution,
  onSelectPalette,
  selectedElement = null,
}: TextureAtlasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const onUpdateTextureRef = useRef(onUpdateTexture);
  const internalTextureRef = useRef<string | null>(null);
  const lastTextureRef = useRef<string | null>(null);
  const paletteRef = useRef(model.palette);
  const isDrawingRef = useRef(false);
  const hasCanvasChangesRef = useRef(false);

  const [activeTool, setActiveTool] = useState<TextureTool>("pencil");
  const [activeColor, setActiveColor] = useState(model.palette.primary);
  const [zoom, setZoom] = useState(10);
  const [showPixelGrid, setShowPixelGrid] = useState(true);
  const [showUvOverlay, setShowUvOverlay] = useState(true);
  const [gradientOpen, setGradientOpen] = useState(false);
  const [gradient, setGradient] = useState<GradientConfig>({ ...DEFAULT_GRADIENT, from: model.palette.highlight, to: model.palette.dark });
  const [gradientTarget, setGradientTarget] = useState<GradientTarget>("all");
  const { canUndo, canRedo, undo, redo, reset, record } = useTextureHistory();

  const resolution = model.textureWidth;
  const paletteColors = [
    model.palette.primary,
    model.palette.secondary,
    model.palette.accent,
    model.palette.dark,
    model.palette.highlight,
    model.palette.glow,
  ];

  useEffect(() => {
    onUpdateTextureRef.current = onUpdateTexture;
  }, [onUpdateTexture]);

  useEffect(() => {
    paletteRef.current = model.palette;
  }, [model.palette]);

  const drawUvOverlay = useCallback(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;

    const context = overlay.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, resolution, resolution);
    if (!showUvOverlay) return;

    context.lineWidth = 0.5;
    context.strokeStyle = "rgba(56, 189, 248, 0.72)";
    context.fillStyle = "rgba(56, 189, 248, 0.08)";

        model.elements.forEach((element) => {
      DIRECTIONS.forEach((direction) => {
        const face = element.faces[direction];
        if (!face) return;
        const [u1, v1, u2, v2] = face.uv;
        context.strokeRect(u1, v1, u2 - u1, v2 - v1);
        context.fillRect(u1, v1, u2 - u1, v2 - v1);
      });
    });

    if (selectedElement) {
      context.lineWidth = 1;
      context.strokeStyle = "rgba(251, 191, 36, 0.95)";
      context.fillStyle = "rgba(251, 191, 36, 0.18)";
      DIRECTIONS.forEach((direction) => {
        const face = selectedElement.faces[direction];
        if (!face) return;
        const [u1, v1, u2, v2] = face.uv;
        context.fillRect(u1, v1, u2 - u1, v2 - v1);
        context.strokeRect(u1 + 0.5, v1 + 0.5, Math.max(0, u2 - u1 - 1), Math.max(0, v2 - v1 - 1));
      });
    }
  }, [model.elements, resolution, showUvOverlay, selectedElement]);

  const publishTexture = useCallback(
    (url: string, shouldRecord: boolean = true) => {
      internalTextureRef.current = url;
      if (shouldRecord) record(url);
      onUpdateTextureRef.current(url);
    },
    [record],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.imageSmoothingEnabled = false;
    let active = true;

    if (!textureDataUrl) {
      const generatedTexture = generateProceduralAtlas(paletteRef.current, resolution);
      reset(generatedTexture);
      publishTexture(generatedTexture, false);
      return undefined;
    }

    const cameFromEditor = internalTextureRef.current === textureDataUrl;
    if (lastTextureRef.current !== textureDataUrl && !cameFromEditor) {
      reset(textureDataUrl);
    }
    lastTextureRef.current = textureDataUrl;
    internalTextureRef.current = null;

    const image = new Image();
    image.onload = () => {
      if (!active) return;
      context.clearRect(0, 0, resolution, resolution);
      context.drawImage(image, 0, 0, resolution, resolution);
      drawUvOverlay();
    };
    image.src = textureDataUrl;

    return () => {
      active = false;
    };
  }, [textureDataUrl, resolution, drawUvOverlay, publishTexture, reset]);

  useEffect(() => {
    drawUvOverlay();
  }, [drawUvOverlay]);

  const getPixelCoordinate = (event: PointerEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const bounds = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - bounds.left) / bounds.width) * resolution);
    const y = Math.floor(((event.clientY - bounds.top) / bounds.height) * resolution);

    return x >= 0 && x < resolution && y >= 0 && y < resolution ? { x, y } : null;
  };

  const commitCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    publishTexture(canvas.toDataURL("image/png"));
  }, [publishTexture]);

  const applyTool = (x: number, y: number): boolean => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return false;

    if (activeTool === "picker") {
      const [red, green, blue] = context.getImageData(x, y, 1, 1).data;
      setActiveColor(`#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`);
      setActiveTool("pencil");
      return false;
    }

    if (activeTool === "bucket") {
      fillCanvasRegion(context, resolution, resolution, x, y, activeColor);
      return true;
    }

    if (activeTool === "eraser") {
      context.clearRect(x, y, 1, 1);
      return true;
    }

    if (activeTool === "dither" && (x + y) % 2 !== 0) return false;
    context.fillStyle = activeColor;
    context.fillRect(x, y, 1, 1);
    return true;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const point = getPixelCoordinate(event);
    if (!point) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const changed = applyTool(point.x, point.y);

    if (activeTool === "bucket") {
      if (changed) commitCanvas();
      return;
    }

    if (activeTool === "picker") return;
    isDrawingRef.current = true;
    hasCanvasChangesRef.current = changed;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDrawingRef.current) return;
    const point = getPixelCoordinate(event);
    if (!point) return;
    hasCanvasChangesRef.current = applyTool(point.x, point.y) || hasCanvasChangesRef.current;
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDrawingRef.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    isDrawingRef.current = false;
    if (hasCanvasChangesRef.current) commitCanvas();
    hasCanvasChangesRef.current = false;
  };

  const handleUndo = () => {
    const previous = undo();
    if (previous) publishTexture(previous, false);
  };

  const handleRedo = () => {
    const next = redo();
    if (next) publishTexture(next, false);
  };

  const handleRegenerate = () => {
    const baked = generateProceduralAtlas(model.palette, resolution);
    publishTexture(baked);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${model.name.toLowerCase().replace(/\s+/g, "_")}_texture_${resolution}x${resolution}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") publishTexture(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const gradientRects = (): PixelRect[] => {
    const half = resolution / 2;
    switch (gradientTarget) {
      case "blade":
        return [{ x: 0, y: 0, w: half, h: half }];
      case "guard":
        return [{ x: half, y: 0, w: half, h: half }];
      case "gem":
        return [{ x: 0, y: half, w: half, h: half }];
      case "rune":
        return [{ x: half, y: half, w: half, h: half }];
      case "selected": {
        if (!selectedElement) return [];
        const seen = new Set<string>();
        return DIRECTIONS.flatMap((direction) => {
          const face = selectedElement.faces[direction];
          if (!face) return [];
          const [u1, v1, u2, v2] = face.uv;
          const key = `${u1},${v1},${u2},${v2}`;
          if (seen.has(key)) return [];
          seen.add(key);
          return [{ x: Math.min(u1, u2), y: Math.min(v1, v2), w: Math.abs(u2 - u1), h: Math.abs(v2 - v1) }];
        });
      }
      default:
        return [{ x: 0, y: 0, w: resolution, h: resolution }];
    }
  };

  const handleApplyGradient = () => {
    const context = canvasRef.current?.getContext("2d");
    const rects = gradientRects();
    if (!context || rects.length === 0) return;
    if (applyGradient(context, rects, gradient) > 0) commitCanvas();
  };

  return (
    <div className="flex h-full flex-col border-t border-[#2d3139] bg-[#181a20] text-xs text-neutral-300 select-none">
      <div className="flex items-center justify-between border-b border-[#2d3139] bg-[#1c1f26] px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-neutral-200">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            UV Atlas Studio
          </span>
          <div className="flex items-center rounded border border-[#2d3139] bg-[#13151b] p-0.5">
            {TEXTURE_RESOLUTIONS.map((value) => (
              <button
                key={value}
                onClick={() => onUpdateResolution(value)}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${
                  resolution === value ? "bg-blue-600 font-bold text-white" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {value}px
              </button>
            ))}
          </div>
          <select
            value={model.theme}
            onChange={(event) => onSelectPalette(PALETTES[event.target.value as ModelTheme])}
            className="rounded border border-[#2d3139] bg-[#13151b] px-2 py-1 text-[11px] text-neutral-200 outline-none focus:border-blue-500"
            aria-label="Texture palette"
          >
            {Object.values(PALETTES).map((palette) => (
              <option key={palette.id} value={palette.id}>{palette.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={handleRegenerate} title="Auto-Bake Texture Atlas" className="flex items-center gap-1 rounded bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-1 font-medium text-white shadow-sm transition hover:from-blue-500 hover:to-indigo-500">
            <Sparkles className="h-3.5 w-3.5" /> Auto-Bake
          </button>
          <label className="flex cursor-pointer items-center gap-1 rounded bg-[#262a34] px-2 py-1 text-neutral-200 transition hover:bg-[#323744]">
            <Upload className="h-3.5 w-3.5" /> Import PNG
            <input type="file" accept="image/png,image/jpeg" onChange={handleUpload} className="hidden" />
          </label>
          <button onClick={handleDownload} title="Download Texture Atlas" className="flex items-center gap-1 rounded bg-[#262a34] px-2 py-1 text-neutral-200 transition hover:bg-[#323744]">
            <Download className="h-3.5 w-3.5" /> Export PNG
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-12 flex-col items-center space-y-2 border-r border-[#2d3139] bg-[#14161d] py-2">
          {[
            { id: "pencil" as const, label: "Pencil", icon: Paintbrush },
            { id: "eraser" as const, label: "Eraser", icon: Eraser },
            { id: "bucket" as const, label: "Fill bucket", icon: PaintBucket },
            { id: "dither" as const, label: "Pixel dither", icon: Grid3X3 },
            { id: "picker" as const, label: "Eyedropper", icon: Pipette },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTool(id)} title={label} className={`rounded p-2 transition ${activeTool === id ? "bg-blue-600 text-white" : "text-neutral-400 hover:bg-[#20242e] hover:text-white"}`}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <button onClick={() => setGradientOpen((value) => !value)} title="グラデーション" className={`rounded p-2 transition ${gradientOpen ? "bg-fuchsia-600 text-white" : "text-neutral-400 hover:bg-[#20242e] hover:text-white"}`}>
            <Palette className="h-4 w-4" />
          </button>
          <div className="my-1 h-px w-6 bg-[#2d3139]" />
          <div className="flex flex-col space-y-1">
            {paletteColors.map((color) => (
              <button key={color} onClick={() => setActiveColor(color)} style={{ backgroundColor: color }} title={color} className={`h-6 w-6 rounded border transition ${activeColor === color ? "scale-110 border-white shadow-sm" : "border-[#404552]"}`} />
            ))}
          </div>
          <input type="color" value={activeColor} onChange={(event) => setActiveColor(event.target.value)} className="mt-1 h-6 w-6 cursor-pointer rounded border border-[#404552] bg-transparent" title="Custom Color" />
        </aside>

        <div className="relative flex flex-1 items-center justify-center overflow-auto bg-[#101217] p-4" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd}>
          <div className="relative overflow-hidden rounded border-2 border-[#2f3542] shadow-2xl" style={{ width: resolution * zoom, height: resolution * zoom, backgroundImage: "linear-gradient(45deg, #1c1f26 25%, transparent 25%), linear-gradient(-45deg, #1c1f26 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1c1f26 75%), linear-gradient(-45deg, transparent 75%, #1c1f26 75%)", backgroundSize: "16px 16px", backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px" }}>
            <canvas ref={canvasRef} width={resolution} height={resolution} className="image-render-pixel block h-full w-full" style={{ imageRendering: "pixelated" }} />
            <canvas ref={overlayCanvasRef} width={resolution} height={resolution} className="image-render-pixel pointer-events-none absolute left-0 top-0 block h-full w-full" style={{ imageRendering: "pixelated" }} />
            {showPixelGrid && zoom >= 6 && <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: `${zoom}px ${zoom}px` }} />}
          </div>

          {gradientOpen && (
            <div onPointerDown={(event) => event.stopPropagation()} onPointerMove={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()} className="absolute left-3 top-3 z-10 max-h-[calc(100%-1.5rem)] w-64 space-y-2 overflow-y-auto rounded-lg border border-fuchsia-500/40 bg-[#14161d]/95 p-2.5 text-[10.5px] shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between font-bold text-fuchsia-200">
                <span>グラデーション</span>
                <span className="text-[9px] font-normal text-neutral-500">Undo対応</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {GRADIENT_PRESETS.map((preset) => (
                  <button key={preset.id} onClick={() => setGradient((current) => ({ ...current, mid: null, reverse: false, ...preset.config }))} className="rounded bg-[#232733] px-1.5 py-0.5 text-[10px] text-neutral-200 hover:bg-fuchsia-700/60">
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <select value={gradient.type} onChange={(event) => setGradient({ ...gradient, type: event.target.value as GradientType })} className="rounded border border-[#2d3139] bg-[#101217] px-1 py-1 text-neutral-200">
                  {GRADIENT_TYPES.map((type) => <option key={type} value={type}>{GRADIENT_LABELS[type]}</option>)}
                </select>
                <select value={gradient.blend} onChange={(event) => setGradient({ ...gradient, blend: event.target.value as BlendMode })} className="rounded border border-[#2d3139] bg-[#101217] px-1 py-1 text-neutral-200">
                  {BLEND_MODES.map((mode) => <option key={mode} value={mode}>{BLEND_LABELS[mode]}</option>)}
                </select>
              </div>
              <select value={gradientTarget} onChange={(event) => setGradientTarget(event.target.value as GradientTarget)} className="w-full rounded border border-[#2d3139] bg-[#101217] px-1 py-1 text-neutral-200">
                {GRADIENT_TARGETS.map((target) => <option key={target.id} value={target.id} disabled={target.id === "selected" && !selectedElement}>{target.label}</option>)}
              </select>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400">色</span>
                <input type="color" value={gradient.from} onChange={(event) => setGradient({ ...gradient, from: event.target.value })} className="h-6 w-6 cursor-pointer rounded border border-[#2d3139] bg-transparent" title="開始色" />
                <label className="flex items-center gap-0.5 text-neutral-400"><input type="checkbox" checked={gradient.mid !== null} onChange={(event) => setGradient({ ...gradient, mid: event.target.checked ? model.palette.glow : null })} className="accent-fuchsia-500" />中間</label>
                {gradient.mid !== null && <input type="color" value={gradient.mid} onChange={(event) => setGradient({ ...gradient, mid: event.target.value })} className="h-6 w-6 cursor-pointer rounded border border-[#2d3139] bg-transparent" title="中間色" />}
                <input type="color" value={gradient.to} onChange={(event) => setGradient({ ...gradient, to: event.target.value })} className="h-6 w-6 cursor-pointer rounded border border-[#2d3139] bg-transparent" title="終了色" />
              </div>
              {([["opacity", "強さ", 0, 1, 0.05], ["steps", "段階 (0=滑らか)", 0, 16, 1], ["frequency", "周波数", 0.5, 8, 0.5]] as const).map(([key, label, min, max, step]) => (
                <label key={key} className="block">
                  <div className="flex justify-between text-neutral-400"><span>{label}</span><span className="font-mono text-fuchsia-300">{gradient[key]}</span></div>
                  <input type="range" min={min} max={max} step={step} value={gradient[key]} onChange={(event) => setGradient({ ...gradient, [key]: Number(event.target.value) })} className="w-full accent-fuchsia-500" />
                </label>
              ))}
              <div className="flex flex-wrap gap-2 text-neutral-300">
                <label className="flex items-center gap-1"><input type="checkbox" checked={gradient.dither} onChange={(event) => setGradient({ ...gradient, dither: event.target.checked })} className="accent-fuchsia-500" />ディザ</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={gradient.reverse} onChange={(event) => setGradient({ ...gradient, reverse: event.target.checked })} className="accent-fuchsia-500" />反転</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={gradient.preserveAlpha} onChange={(event) => setGradient({ ...gradient, preserveAlpha: event.target.checked })} className="accent-fuchsia-500" />透明保持</label>
              </div>
              <button onClick={handleApplyGradient} className="w-full rounded bg-gradient-to-r from-fuchsia-600 to-indigo-600 py-1.5 text-[11px] font-bold text-white hover:opacity-90">適用</button>
            </div>
          )}

          <div className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-md border border-[#2d3139] bg-[#181a20]/90 px-2.5 py-1 text-[11px] shadow-lg backdrop-blur">
            <button onClick={() => setZoom((value) => Math.max(2, value - 2))} className="p-1 text-neutral-400 hover:text-white" title="Zoom out"><ZoomOut className="h-3.5 w-3.5" /></button>
            <span className="w-10 text-center font-mono text-neutral-300">{zoom}x</span>
            <button onClick={() => setZoom((value) => Math.min(24, value + 2))} className="p-1 text-neutral-400 hover:text-white" title="Zoom in"><ZoomIn className="h-3.5 w-3.5" /></button>
            <div className="mx-1 h-3.5 w-px bg-[#2d3139]" />
            <button onClick={() => setShowPixelGrid((value) => !value)} className={`rounded px-1.5 py-0.5 text-[10px] ${showPixelGrid ? "bg-blue-600/30 font-semibold text-blue-300" : "text-neutral-400"}`}>Grid</button>
            <button onClick={() => setShowUvOverlay((value) => !value)} className={`rounded px-1.5 py-0.5 text-[10px] ${showUvOverlay ? "bg-blue-600/30 font-semibold text-blue-300" : "text-neutral-400"}`}>UV Outlines</button>
            <div className="mx-1 h-3.5 w-px bg-[#2d3139]" />
            <button onClick={handleUndo} disabled={!canUndo} className="p-1 text-neutral-400 hover:text-white disabled:opacity-40" title="Undo"><Undo2 className="h-3.5 w-3.5" /></button>
            <button onClick={handleRedo} disabled={!canRedo} className="p-1 text-neutral-400 hover:text-white disabled:opacity-40" title="Redo"><Redo2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
