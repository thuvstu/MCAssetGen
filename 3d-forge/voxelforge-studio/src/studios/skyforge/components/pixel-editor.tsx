"use client";

import { useEffect, useRef } from "react";
import { drawPixels } from "@/studios/skyforge/components/pixel-image";
import { hexToRgb, rgbToHex } from "@/studios/skyforge/lib/colors";

export type EditorTool = "pencil" | "eraser" | "fill" | "picker";

function idx(x: number, y: number, w: number) {
  return (y * w + x) * 4;
}

function floodFill(pixels: number[], w: number, h: number, x: number, y: number, color: number[]) {
  const start = idx(x, y, w);
  const tr = pixels[start]!;
  const tg = pixels[start + 1]!;
  const tb = pixels[start + 2]!;
  const ta = pixels[start + 3]!;
  if (tr === color[0] && tg === color[1] && tb === color[2] && ta === color[3]) return pixels;
  const next = pixels.slice();
  const stack: [number, number][] = [[x, y]];
  const seen = new Set<number>();
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
    const key = cy * w + cx;
    if (seen.has(key)) continue;
    seen.add(key);
    const i = idx(cx, cy, w);
    if (next[i] !== tr || next[i + 1] !== tg || next[i + 2] !== tb || next[i + 3] !== ta) continue;
    next[i] = color[0]!;
    next[i + 1] = color[1]!;
    next[i + 2] = color[2]!;
    next[i + 3] = color[3]!;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return next;
}

export function PixelEditor({
  pixels,
  width,
  height,
  tool,
  color,
  onChange,
  onPick,
}: {
  pixels: number[];
  width: number;
  height: number;
  tool: EditorTool;
  color: string;
  onChange: (pixels: number[]) => void;
  onPick: (hex: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const pixelsRef = useRef(pixels);
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const onChangeRef = useRef(onChange);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    pixelsRef.current = pixels;
    toolRef.current = tool;
    colorRef.current = color;
    onChangeRef.current = onChange;
    onPickRef.current = onPick;
  }, [pixels, tool, color, onChange, onPick]);

  useEffect(() => {
    if (canvasRef.current) drawPixels(canvasRef.current, pixels, width, height);
  }, [pixels, width, height]);

  function cellFromEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * height);
    if (x < 0 || y < 0 || x >= width || y >= height) return null;
    return { x, y };
  }

  function apply(x: number, y: number) {
    const current = pixelsRef.current;
    const i = idx(x, y, width);
    const active = toolRef.current;
    if (active === "picker") {
      const a = current[i + 3] ?? 0;
      if (a < 8) onPickRef.current("#000000");
      else onPickRef.current(rgbToHex([current[i]!, current[i + 1]!, current[i + 2]!]));
      return;
    }
    if (active === "fill") {
      const rgb = hexToRgb(colorRef.current);
      const filled = floodFill(current, width, height, x, y, [...rgb, 255]);
      pixelsRef.current = filled;
      onChangeRef.current(filled);
      return;
    }
    const next = current.slice();
    if (active === "eraser") {
      next[i] = 0;
      next[i + 1] = 0;
      next[i + 2] = 0;
      next[i + 3] = 0;
    } else {
      const rgb = hexToRgb(colorRef.current);
      next[i] = rgb[0];
      next[i + 1] = rgb[1];
      next[i + 2] = rgb[2];
      next[i + 3] = 255;
    }
    pixelsRef.current = next;
    onChangeRef.current(next);
  }

  return (
    <canvas
      ref={canvasRef}
      className="pixelated w-full cursor-crosshair touch-none border border-line bg-ink"
      style={{ aspectRatio: "1 / 1", imageRendering: "pixelated" }}
      onPointerDown={(e) => {
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
        drawing.current = true;
        const cell = cellFromEvent(e);
        if (cell) apply(cell.x, cell.y);
      }}
      onPointerMove={(e) => {
        if (!drawing.current || toolRef.current === "fill" || toolRef.current === "picker") return;
        const cell = cellFromEvent(e);
        if (cell) apply(cell.x, cell.y);
      }}
      onPointerUp={() => {
        drawing.current = false;
      }}
    />
  );
}
