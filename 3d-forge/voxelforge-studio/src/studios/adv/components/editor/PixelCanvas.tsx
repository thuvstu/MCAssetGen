"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  A, applyGradient, brush, clonePix, drawEllipse, drawLine, drawRect, floodFill, getPx, GradientOpts,
  Pix, setPx, adjustLight, shiftHue, cssRgba, withAlpha, mix, rgba,
} from "@/studios/adv/lib/pixel/core";

export type Tool =
  | "pencil" | "eraser" | "fill" | "line" | "rect" | "rectfill" | "ellipse" | "ellipsefill"
  | "picker" | "gradient" | "lighten" | "darken" | "hue" | "smudge" | "glow" | "dither" | "select";

export type Mirror = "none" | "h" | "v" | "both" | "diag";

export type CanvasProps = {
  pix: Pix;
  onion?: Pix | null;
  tool: Tool;
  color: number;
  color2: number;
  size: number;
  mirror: Mirror;
  gradient: GradientOpts;
  zoom: number;
  showGrid: boolean;
  onCommit: (p: Pix) => void;
  onPick: (c: number) => void;
  onHover?: (x: number, y: number) => void;
};

export default function PixelCanvas(props: CanvasProps) {
  const { pix, onion, tool, color, color2, size, mirror, gradient, zoom, showGrid, onCommit, onPick, onHover } = props;
  const ref = useRef<HTMLCanvasElement>(null);
  const work = useRef<Pix | null>(null);
  const start = useRef<[number, number] | null>(null);
  const last = useRef<[number, number] | null>(null);
  const drawing = useRef(false);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [selection, setSelection] = useState<[number, number, number, number] | null>(null);
  const rightBtn = useRef(false);

  const render = useCallback(
    (p: Pix) => {
      const c = ref.current;
      if (!c) return;
      const ctx = c.getContext("2d")!;
      const W = p.w * zoom, H = p.h * zoom;
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
      ctx.imageSmoothingEnabled = false;
      // checkerboard
      const cs = Math.max(4, zoom);
      for (let y = 0; y < H; y += cs)
        for (let x = 0; x < W; x += cs) {
          ctx.fillStyle = ((x / cs + y / cs) % 2 === 0) ? "#2a2a33" : "#20202a";
          ctx.fillRect(x, y, cs, cs);
        }
      if (onion) {
        for (let y = 0; y < onion.h; y++)
          for (let x = 0; x < onion.w; x++) {
            const v = onion.data[y * onion.w + x];
            if (A(v) === 0) continue;
            ctx.fillStyle = cssRgba(withAlpha(v, A(v) * 0.3));
            ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
          }
      }
      for (let y = 0; y < p.h; y++)
        for (let x = 0; x < p.w; x++) {
          const v = p.data[y * p.w + x];
          if (A(v) === 0) continue;
          ctx.fillStyle = cssRgba(v);
          ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
        }
      if (showGrid && zoom >= 6) {
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth = 1;
        for (let x = 0; x <= p.w; x++) { ctx.beginPath(); ctx.moveTo(x * zoom + 0.5, 0); ctx.lineTo(x * zoom + 0.5, H); ctx.stroke(); }
        for (let y = 0; y <= p.h; y++) { ctx.beginPath(); ctx.moveTo(0, y * zoom + 0.5); ctx.lineTo(W, y * zoom + 0.5); ctx.stroke(); }
        // center / diagonal guides
        ctx.strokeStyle = "rgba(120,180,255,0.15)";
        ctx.beginPath(); ctx.moveTo((p.w / 2) * zoom, 0); ctx.lineTo((p.w / 2) * zoom, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, (p.h / 2) * zoom); ctx.lineTo(W, (p.h / 2) * zoom); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W, 0); ctx.stroke();
      }
      if (hover && !drawing.current) {
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        const r = Math.floor(size / 2), off = size % 2 === 0 ? 1 : 0;
        ctx.strokeRect((hover[0] - r + off) * zoom + 0.5, (hover[1] - r + off) * zoom + 0.5, (size) * zoom - 1, size * zoom - 1);
      }
      if (selection) {
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = "#7dd3fc";
        const [sx, sy, ex, ey] = selection;
        ctx.strokeRect(Math.min(sx, ex) * zoom + 0.5, Math.min(sy, ey) * zoom + 0.5, (Math.abs(ex - sx) + 1) * zoom - 1, (Math.abs(ey - sy) + 1) * zoom - 1);
        ctx.setLineDash([]);
      }
    },
    [zoom, showGrid, onion, hover, size, selection],
  );

  useEffect(() => {
    if (!drawing.current) render(pix);
  }, [pix, render]);

  const toCell = (e: React.PointerEvent): [number, number] => {
    const rect = ref.current!.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * pix.w);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * pix.h);
    return [Math.max(0, Math.min(pix.w - 1, x)), Math.max(0, Math.min(pix.h - 1, y))];
  };

  const mirrored = (x: number, y: number): [number, number][] => {
    const pts: [number, number][] = [[x, y]];
    const W = pix.w - 1, H = pix.h - 1;
    if (mirror === "h" || mirror === "both") pts.push([W - x, y]);
    if (mirror === "v" || mirror === "both") pts.push([x, H - y]);
    if (mirror === "both") pts.push([W - x, H - y]);
    if (mirror === "diag") pts.push([H - y, W - x]); // mirror across the anti-diagonal (weapon axis)
    return pts;
  };

  const applyPoint = (p: Pix, x: number, y: number, c: number, prevXY: [number, number] | null) => {
    const pts = mirrored(x, y);
    const prevPts = prevXY ? mirrored(prevXY[0], prevXY[1]) : null;
    pts.forEach(([px, py], k) => {
      const pp = prevPts ? prevPts[k] : null;
      switch (tool) {
        case "pencil":
          if (pp) drawLine(p, pp[0], pp[1], px, py, c, size); else brush(p, px, py, c, size);
          break;
        case "eraser":
          if (pp) drawLine(p, pp[0], pp[1], px, py, 0, size); else brush(p, px, py, 0, size);
          break;
        case "lighten":
        case "darken": {
          const r = Math.floor(size / 2);
          for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const v = getPx(p, px + dx, py + dy);
            if (A(v) === 0) continue;
            setPx(p, px + dx, py + dy, adjustLight(v, tool === "lighten" ? 0.06 : -0.06));
          }
          break;
        }
        case "hue": {
          const r = Math.floor(size / 2);
          for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const v = getPx(p, px + dx, py + dy);
            if (A(v) === 0) continue;
            setPx(p, px + dx, py + dy, shiftHue(v, 0.03));
          }
          break;
        }
        case "glow": {
          const r = Math.max(1, Math.floor(size / 2) + 1);
          for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const d = Math.hypot(dx, dy);
            if (d > r) continue;
            const v = getPx(p, px + dx, py + dy);
            const f = (1 - d / (r + 0.5)) * 0.5;
            if (A(v) === 0) setPx(p, px + dx, py + dy, withAlpha(c, f * 255));
            else setPx(p, px + dx, py + dy, mix(v, withAlpha(c, A(v)), f));
          }
          break;
        }
        case "dither": {
          const r = Math.floor(size / 2);
          for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const X = px + dx, Y = py + dy;
            if ((X + Y) % 2 === 0) setPx(p, X, Y, c); else if (color2) setPx(p, X, Y, color2);
          }
          break;
        }
        case "smudge": {
          if (!pp) break;
          const v = getPx(p, pp[0], pp[1]);
          const cur = getPx(p, px, py);
          if (A(v) > 0 && A(cur) > 0) brush(p, px, py, mix(cur, v, 0.5), size);
          break;
        }
      }
    });
  };

  const applyShape = (p: Pix, x0: number, y0: number, x1: number, y1: number, c: number) => {
    const a = mirrored(x0, y0), b = mirrored(x1, y1);
    a.forEach(([ax, ay], k) => {
      const [bx, by] = b[k];
      switch (tool) {
        case "line": drawLine(p, ax, ay, bx, by, c, size); break;
        case "rect": drawRect(p, ax, ay, bx, by, c, false); break;
        case "rectfill": drawRect(p, ax, ay, bx, by, c, true); break;
        case "ellipse": drawEllipse(p, ax, ay, bx, by, c, false); break;
        case "ellipsefill": drawEllipse(p, ax, ay, bx, by, c, true); break;
        case "gradient": {
          const region = selection ? regionMask(selection, p.w, p.h) : undefined;
          applyGradient(p, ax + 0.5, ay + 0.5, bx + 0.5, by + 0.5, gradient, region);
          break;
        }
      }
    });
  };

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    rightBtn.current = e.button === 2;
    const [x, y] = toCell(e);
    if (tool === "picker") { onPick(getPx(pix, x, y)); return; }
    if (tool === "select") { setSelection([x, y, x, y]); start.current = [x, y]; drawing.current = true; return; }
    const c = rightBtn.current ? color2 : color;
    const w = clonePix(pix);
    work.current = w;
    start.current = [x, y];
    last.current = [x, y];
    drawing.current = true;
    if (tool === "fill") {
      mirrored(x, y).forEach(([px, py]) => floodFill(w, px, py, c, !e.shiftKey));
      render(w);
      return;
    }
    if (isShapeTool(tool)) { render(w); return; }
    applyPoint(w, x, y, c, null);
    render(w);
  };
  const onMove = (e: React.PointerEvent) => {
    const [x, y] = toCell(e);
    setHover([x, y]);
    onHover?.(x, y);
    if (!drawing.current) return;
    if (tool === "select") { setSelection((s) => (s ? [s[0], s[1], x, y] : null)); return; }
    const w = work.current;
    if (!w || tool === "fill") return;
    const c = rightBtn.current ? color2 : color;
    if (isShapeTool(tool)) {
      const preview = clonePix(pix);
      applyShape(preview, start.current![0], start.current![1], x, y, c);
      render(preview);
      return;
    }
    if (last.current && last.current[0] === x && last.current[1] === y) return;
    applyPoint(w, x, y, c, last.current);
    last.current = [x, y];
    render(w);
  };
  const onUp = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    drawing.current = false;
    if (tool === "select") {
      const s = selection;
      if (s && s[0] === s[2] && s[1] === s[3]) setSelection(null);
      return;
    }
    const w = work.current;
    if (!w) return;
    const c = rightBtn.current ? color2 : color;
    if (isShapeTool(tool)) {
      const [x, y] = toCell(e);
      applyShape(w, start.current![0], start.current![1], x, y, c);
    }
    work.current = null;
    onCommit(w);
  };

  return (
    <canvas
      ref={ref}
      className="touch-none select-none rounded shadow-2xl ring-1 ring-white/10"
      style={{ imageRendering: "pixelated", cursor: tool === "picker" ? "crosshair" : "none" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={() => setHover(null)}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

function isShapeTool(t: Tool) {
  return t === "line" || t === "rect" || t === "rectfill" || t === "ellipse" || t === "ellipsefill" || t === "gradient";
}
function regionMask(sel: [number, number, number, number], w: number, h: number): Uint8Array {
  const m = new Uint8Array(w * h);
  const [sx, sy, ex, ey] = sel;
  for (let y = Math.min(sy, ey); y <= Math.max(sy, ey); y++)
    for (let x = Math.min(sx, ex); x <= Math.max(sx, ex); x++) m[y * w + x] = 1;
  return m;
}
export const TRANSPARENT = rgba(0, 0, 0, 0);
