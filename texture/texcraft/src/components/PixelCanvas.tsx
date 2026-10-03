import { useEffect, useMemo, useRef, useState } from 'react';
import { Tex, cloneTex, hexToRgb, rgbToHex, texToCanvas, clamp } from '../lib/tex';

export type Tool = 'hand' | 'pencil' | 'eraser' | 'picker' | 'fill' | 'dodge' | 'burn' | 'noise';
export type ViewMode = 'after' | 'before' | 'split';

interface Props {
  base: Tex;
  output: Tex;
  view: ViewMode;
  grid: boolean;
  zoom: number;
  tool: Tool;
  color: string;
  brush: number;
  mirror: boolean;
  bg: string;
  onStroke: (t: Tex, key: string) => void;
  onPick: (hex: string) => void;
}

function applyTool(t: Tex, x: number, y: number, tool: Tool, rgb: [number, number, number], brush: number, mirror: boolean) {
  const pts: [number, number][] = [];
  const r0 = Math.floor((brush - 1) / 2);
  for (let oy = 0; oy < brush; oy++) for (let ox = 0; ox < brush; ox++) {
    pts.push([x - r0 + ox, y - r0 + oy]);
    if (mirror) pts.push([t.w - 1 - (x - r0 + ox), y - r0 + oy]);
  }
  const visited = new Set<number>();
  for (const [px, py] of pts) {
    if (px < 0 || py < 0 || px >= t.w || py >= t.h) continue;
    const i = (py * t.w + px) * 4;
    if (visited.has(i)) continue;
    visited.add(i);
    const d = t.d;
    switch (tool) {
      case 'pencil': d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255; break;
      case 'eraser': d[i + 3] = 0; break;
      case 'dodge': if (d[i + 3]) for (let q = 0; q < 3; q++) d[i + q] = d[i + q] + (255 - d[i + q]) * 0.12; break;
      case 'burn': if (d[i + 3]) for (let q = 0; q < 3; q++) d[i + q] = d[i + q] * 0.88; break;
      case 'noise': if (d[i + 3]) { const n = (Math.random() - 0.5) * 36; for (let q = 0; q < 3; q++) d[i + q] = clamp(d[i + q] + n); } break;
    }
  }
}

function floodFill(t: Tex, x: number, y: number, rgb: [number, number, number]) {
  const i0 = (y * t.w + x) * 4;
  const target = [t.d[i0], t.d[i0 + 1], t.d[i0 + 2], t.d[i0 + 3]];
  if (target[0] === rgb[0] && target[1] === rgb[1] && target[2] === rgb[2] && target[3] === 255) return;
  const same = (i: number) => target[3] === 0 ? t.d[i + 3] === 0 : t.d[i] === target[0] && t.d[i + 1] === target[1] && t.d[i + 2] === target[2] && t.d[i + 3] === target[3];
  const stack = [[x, y]];
  const seen = new Uint8Array(t.w * t.h);
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= t.w || cy >= t.h) continue;
    const k = cy * t.w + cx;
    if (seen[k]) continue;
    seen[k] = 1;
    const i = k * 4;
    if (!same(i)) continue;
    t.d[i] = rgb[0]; t.d[i + 1] = rgb[1]; t.d[i + 2] = rgb[2]; t.d[i + 3] = 255;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
}

export default function PixelCanvas(p: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [split, setSplit] = useState(0.5);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const stroke = useRef<{ tex: Tex; key: string; last: [number, number] } | null>(null);
  const dragSplit = useRef(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const out = p.output;
  const S = Math.max(1, Math.floor(1024 / Math.max(out.w, out.h)));
  const CW = out.w * S, CH = out.h * S;

  const baseCanvas = useMemo(() => texToCanvas(p.base), [p.base]);
  const outCanvas = useMemo(() => texToCanvas(out), [out]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CW, CH);
    if (p.view === 'before') ctx.drawImage(baseCanvas, 0, 0, CW, CH);
    else ctx.drawImage(outCanvas, 0, 0, CW, CH);
    if (p.view === 'split') {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, CW * split, CH);
      ctx.clip();
      ctx.clearRect(0, 0, CW * split, CH);
      ctx.drawImage(baseCanvas, 0, 0, CW, CH);
      ctx.restore();
    }
    if (p.grid && p.base.w <= 128) {
      const gs = CW / p.base.w;
      ctx.strokeStyle = 'rgba(0,0,0,0.17)';
      ctx.lineWidth = Math.max(1, S / 24);
      ctx.beginPath();
      for (let i = 1; i < p.base.w; i++) { ctx.moveTo(i * gs, 0); ctx.lineTo(i * gs, CH); }
      const gsy = CH / p.base.h;
      for (let i = 1; i < p.base.h; i++) { ctx.moveTo(0, i * gsy); ctx.lineTo(CW, i * gsy); }
      ctx.stroke();
      if (p.base.w >= 32) {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        for (let i = 16; i < p.base.w; i += 16) { ctx.moveTo(i * gs, 0); ctx.lineTo(i * gs, CH); }
        for (let i = 16; i < p.base.h; i += 16) { ctx.moveTo(0, i * gsy); ctx.lineTo(CW, i * gsy); }
        ctx.stroke();
      }
    }
    if (hover && p.tool !== 'picker' && p.tool !== 'hand') {
      const gs = CW / p.base.w, gsy = CH / p.base.h;
      const r0 = Math.floor((p.brush - 1) / 2);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(2, S / 10);
      ctx.strokeRect((hover[0] - r0) * gs, (hover[1] - r0) * gsy, gs * p.brush, gsy * p.brush);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = Math.max(1, S / 20);
      ctx.strokeRect((hover[0] - r0) * gs, (hover[1] - r0) * gsy, gs * p.brush, gsy * p.brush);
    }
    if (p.view === 'split') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(CW * split - 2, 0, 4, CH);
      ctx.fillStyle = '#b9ed80';
      ctx.fillRect(CW * split - 12, CH / 2 - 24, 24, 48);
    }
  }, [baseCanvas, outCanvas, p.view, p.grid, split, hover, CW, CH, S, p.base.w, p.base.h, p.tool, p.brush]);

  const toBase = (e: React.PointerEvent): [number, number, number] => {
    const r = ref.current!.getBoundingClientRect();
    const u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
    return [Math.floor(u * p.base.w), Math.floor(v * p.base.h), u];
  };

  const lineTo = (t: Tex, a: [number, number], b: [number, number]) => {
    let [x0, y0] = a;
    const [x1, y1] = b;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    const rgb = hexToRgb(p.color);
    for (let n = 0; n < 512; n++) {
      if (n > 0) applyTool(t, x0, y0, p.tool, rgb, p.brush, p.mirror);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const [x, y, u] = toBase(e);
    (e.target as Element).setPointerCapture(e.pointerId);
    if (p.view === 'split' && Math.abs(u - split) < 0.03) { dragSplit.current = true; return; }
    if (p.tool === 'hand') {
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      return;
    }
    if (x < 0 || y < 0 || x >= p.base.w || y >= p.base.h) return;
    if (p.tool === 'picker') {
      const src = p.view === 'before' ? p.base : out;
      const ox = Math.floor((x / p.base.w) * src.w + 0.001), oy = Math.floor((y / p.base.h) * src.h + 0.001);
      const i = (oy * src.w + ox) * 4;
      p.onPick(rgbToHex(src.d[i], src.d[i + 1], src.d[i + 2]));
      return;
    }
    const tex = cloneTex(p.base);
    const key = 'stroke' + Date.now();
    if (p.tool === 'fill') {
      floodFill(tex, x, y, hexToRgb(p.color));
      if (p.mirror) floodFill(tex, tex.w - 1 - x, y, hexToRgb(p.color));
      p.onStroke(tex, key);
      return;
    }
    applyTool(tex, x, y, p.tool, hexToRgb(p.color), p.brush, p.mirror);
    stroke.current = { tex, key, last: [x, y] };
    p.onStroke(cloneTex(tex), key);
  };
  const onMove = (e: React.PointerEvent) => {
    if (panStart.current) {
      const a = panStart.current;
      setPan({ x: a.px + e.clientX - a.x, y: a.py + e.clientY - a.y });
      return;
    }
    const [x, y, u] = toBase(e);
    if (dragSplit.current) { setSplit(Math.min(1, Math.max(0, u))); return; }
    setHover(x >= 0 && y >= 0 && x < p.base.w && y < p.base.h ? [x, y] : null);
    const s = stroke.current;
    if (!s) return;
    if (s.last[0] === x && s.last[1] === y) return;
    lineTo(s.tex, s.last, [x, y]);
    s.last = [x, y];
    p.onStroke(cloneTex(s.tex), s.key);
  };
  const onUp = () => {
    stroke.current = null;
    dragSplit.current = false;
    panStart.current = null;
  };

  const aspect = out.h / out.w;
  return (
    <div className="pixel-editor" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
      <div
        className="pixel-canvas-wrap"
        style={{ width: p.zoom, height: p.zoom * aspect, background: p.bg }}
      >
        <div className="ruler ruler-top" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <span key={i} style={{ left: `${i * 12.5}%` }}>{Math.round(i * p.base.w / 8)}</span>)}</div>
        <div className="ruler ruler-left" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <span key={i} style={{ top: `${i * 12.5}%` }}>{Math.round(i * p.base.h / 8)}</span>)}</div>
        <canvas
          ref={ref}
          width={CW}
          height={CH}
          className="w-full h-full touch-none"
          style={{ imageRendering: 'pixelated', cursor: p.tool === 'hand' ? 'grab' : p.tool === 'picker' ? 'copy' : 'crosshair' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onLostPointerCapture={onUp}
          onPointerLeave={() => setHover(null)}
        />
        {p.view === 'split' && (
          <>
            <span className="compare-label before">元画像</span>
            <span className="compare-label after">編集後</span>
          </>
        )}
      </div>
      <div className="canvas-coordinate">
        {hover ? <>X {String(hover[0]).padStart(3, '0')} <span /> Y {String(hover[1]).padStart(3, '0')}</> : <>PIXEL PERFECT <span /> {out.w} × {out.h}</>}
      </div>
    </div>
  );
}
