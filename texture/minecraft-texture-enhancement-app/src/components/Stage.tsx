import { useCallback, useEffect, useRef, useState } from "react";
import { renderPipeline, paintTo, isAnimated, type Inst } from "../lib/pipeline";
import { Icon, Btn } from "./ui";
import Minecraft3DPreview from "./Minecraft3DPreview";
import { cn } from "../utils/cn";

export interface PixelInfo { x: number; y: number; rgba: number[] }

interface Props {
  base: ImageData;
  insts: Inst[];
  result: ImageData;
  size: number;
  seed: number;
  playing: boolean;
  zoomMode: number; // -1 = 自動フィット, それ以外は 1テクセルあたりのpx
  grid: boolean;
  tile: boolean;
  view3d: boolean;
  drawActive?: boolean;
  onPixelPaint?: (x: number, y: number) => void;
  compare: number | null; // 0..1
  texName: string;
  colors: number;
  opaque: number;
  onZoom: (z: number) => void;
  onGrid: (v: boolean) => void;
  onTile: (v: boolean) => void;
  onView3d: (v: boolean) => void;
  onCompare: (v: number | null) => void;
  onPlay: (v: boolean) => void;
  onCanvasReady?: (cv: HTMLCanvasElement | null) => void;
}

export default function Stage({
  base, insts, result, size, seed, playing, zoomMode, grid, tile, view3d, drawActive, onPixelPaint, compare, texName,
  colors, opaque, onZoom, onGrid, onTile, onView3d, onCompare, onPlay, onCanvasReady,
}: Props) {
  const afterRef = useRef<HTMLCanvasElement>(null);
  const beforeRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tmpRef = useRef<HTMLCanvasElement | null>(null);
  const [box, setBox] = useState({ w: 640, h: 520 });
  const [px, setPx] = useState(320);
  const animRef = useRef(0);
  const tRef = useRef(0);
  const [fps, setFps] = useState(60);
  const [hover, setHover] = useState<PixelInfo | null>(null);

  const reps = tile ? 3 : 1;
  const dim = size * reps;
  const cell = px / dim;
  const animated = isAnimated(insts);

  // ---- コンテナ計測 ----
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const maxW = box.w - 64, maxH = box.h - 64;
    const fit = Math.max(1, Math.floor(Math.min(maxW, maxH) / dim));
    setPx(Math.max(24, (zoomMode < 0 ? fit : zoomMode) * dim));
  }, [box.w, box.h, dim, zoomMode]);

  // ---- 描画（タイル対応） ----
  const paint = useCallback((img: ImageData, cv: HTMLCanvasElement | null) => {
    if (!cv) return;
    if (reps === 1) { paintTo(cv, img); return; }
    if (!tmpRef.current) tmpRef.current = document.createElement("canvas");
    const tmp = tmpRef.current;
    if (tmp.width !== img.width) { tmp.width = img.width; tmp.height = img.height; }
    tmp.getContext("2d")!.putImageData(img, 0, 0);
    if (cv.width !== dim) { cv.width = dim; cv.height = dim; }
    const g = cv.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, dim, dim);
    for (let y = 0; y < reps; y++) for (let x = 0; x < reps; x++) g.drawImage(tmp, x * size, y * size);
  }, [reps, dim, size]);

  const paintStatic = useCallback(() => {
    paint(result, afterRef.current);
    paint(base, beforeRef.current);
    onCanvasReady?.(afterRef.current);
  }, [paint, result, base, onCanvasReady]);

  useEffect(() => { paintStatic(); }, [paintStatic]);
  useEffect(() => { if (compare !== null) paint(base, beforeRef.current); }, [compare, base, paint]);
  useEffect(() => {
    if (afterRef.current) onCanvasReady?.(afterRef.current);
  }, [onCanvasReady]);

  // ---- アニメーションループ ----
  useEffect(() => {
    if (!playing || !animated) {
      cancelAnimationFrame(animRef.current);
      tRef.current = 0;
      paintStatic();
      return;
    }
    let last = performance.now(), acc = 0, frames = 0, mark = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      tRef.current += dt;
      paint(renderPipeline(base, insts, tRef.current, seed), afterRef.current);
      frames++; acc += dt;
      if (now - mark > 600) { setFps(Math.round(frames / Math.max(acc, 0.001))); frames = 0; acc = 0; mark = now; }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, animated, base, insts, seed, paint, paintStatic]);

  const [isPainting, setIsPainting] = useState(false);

  const handlePointerCoord = (e: React.MouseEvent) => {
    const cv = afterRef.current;
    if (!cv) return null;
    const r = cv.getBoundingClientRect();
    const gx = Math.floor(((e.clientX - r.left) / r.width) * dim);
    const gy = Math.floor(((e.clientY - r.top) / r.height) * dim);
    if (gx < 0 || gy < 0 || gx >= dim || gy >= dim) return null;
    return { x: gx % size, y: gy % size };
  };

  const handleMove = (e: React.MouseEvent) => {
    const coord = handlePointerCoord(e);
    if (!coord) { setHover(null); return; }
    const { x, y } = coord;
    const i = (y * size + x) << 2;
    setHover({ x, y, rgba: [result.data[i], result.data[i + 1], result.data[i + 2], result.data[i + 3]] });
    if (drawActive && isPainting) {
      onPixelPaint?.(x, y);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!drawActive) return;
    setIsPainting(true);
    const coord = handlePointerCoord(e);
    if (coord) onPixelPaint?.(coord.x, coord.y);
  };

  const handleMouseUp = () => {
    setIsPainting(false);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={wrapRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {view3d && afterRef.current ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#090c12]">
            <Minecraft3DPreview canvas={afterRef.current} size={size} />
          </div>
        ) : null}
        {/* アンビエントな台座 */}
        <div
          className="pointer-events-none absolute rounded-full blur-3xl transition-all duration-700"
          style={{
            width: px * 1.7, height: px * 1.7,
            background: "radial-gradient(circle, rgba(245,166,60,0.15), rgba(55,214,196,0.07) 45%, transparent 70%)",
          }}
        />
        <div className="relative" style={{ width: px, height: px }}>
          <div className="checker absolute -inset-2 rounded-[4px] border border-[var(--line)]" />
          {[["-top-2 -left-2", "border-t-2 border-l-2"], ["-top-2 -right-2", "border-t-2 border-r-2"],
          ["-bottom-2 -left-2", "border-b-2 border-l-2"], ["-bottom-2 -right-2", "border-b-2 border-r-2"]].map(([pos, b], i) => (
            <span key={i} className={cn("pointer-events-none absolute h-3 w-3 border-[var(--amber)] opacity-70", pos, b)} />
          ))}

          <canvas
            ref={afterRef} width={dim} height={dim}
            onMouseMove={handleMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { setHover(null); setIsPainting(false); }}
            className={cn("pixelated absolute inset-0", drawActive ? "cursor-cell" : "cursor-crosshair")}
            style={{ width: px, height: px }}
          />
          {compare !== null && (
            <canvas
              ref={beforeRef} width={dim} height={dim}
              className="pixelated pointer-events-none absolute inset-0"
              style={{ width: px, height: px, clipPath: `inset(0 ${100 - compare * 100}% 0 0)` }}
            />
          )}
          {grid && cell >= 3 && (
            <div className="grid-overlay pointer-events-none absolute inset-0 mix-blend-overlay"
              style={{ backgroundSize: `${cell}px ${cell}px` }} />
          )}
          {tile && reps > 1 && (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-[var(--teal)]/35" />
              <div className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-[var(--teal)]/35" />
              <div className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-[var(--teal)]/35" />
              <div className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-[var(--teal)]/35" />
            </>
          )}
          {compare !== null && (
            <div className="pointer-events-none absolute inset-y-0" style={{ left: `${compare * 100}%` }}>
              <div className="absolute inset-y-0 -left-px w-0.5 bg-[var(--teal)] shadow-[0_0_12px_rgba(55,214,196,0.9)]" />
              <div className="absolute top-1/2 -left-[13px] flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--teal)] bg-[#0d1016] text-[var(--teal)]">
                <Icon name="compare" className="h-3 w-3" />
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute -top-7 left-0 flex items-center gap-2">
            <span className="font-bit text-[9px] uppercase tracking-[0.2em] text-[var(--ink3)]">{texName}</span>
            <span className="rounded-[2px] border border-[var(--line)] bg-[#12161f] px-1.5 py-0.5 font-bit text-[9px] text-[var(--amber)]">
              {size}×{size}{reps > 1 ? ` · ${reps}×${reps} TILE` : ""}
            </span>
            {animated && playing && (
              <span className="flex items-center gap-1 rounded-[2px] border border-[var(--teal)]/40 bg-[#12161f] px-1.5 py-0.5 font-bit text-[9px] text-[var(--teal)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--teal)]" />LIVE {fps}fps
              </span>
            )}
          </div>
          <div className="pointer-events-none absolute -bottom-7 right-0 font-bit text-[9px] uppercase tracking-[0.2em] text-[var(--ink3)]">
            {compare !== null ? "BEFORE / AFTER" : zoomMode < 0 ? "AUTO FIT" : `${cell.toFixed(1)}px / texel`}
          </div>
        </div>
      </div>

      {/* ---- ツールバー ---- */}
      <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--line)] bg-[#11151d]/85 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-1">
          <span className="mr-1 font-bit text-[9px] uppercase tracking-[0.16em] text-[var(--ink3)]">ZOOM</span>
          {[[-1, "FIT"], [4, "4×"], [8, "8×"], [12, "12×"], [20, "20×"]].map(([z, l]) => (
            <Btn key={String(z)} size="sm" active={zoomMode === z} accent="#59a7ff" onClick={() => onZoom(z as number)}>
              {l}
            </Btn>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Btn size="sm" active={grid} accent="#b6e14f" onClick={() => onGrid(!grid)} title="ピクセルグリッド (G)">
            <Icon name="grid" className="h-3.5 w-3.5" />グリッド
          </Btn>
          <Btn size="sm" active={tile} accent="#59a7ff" onClick={() => onTile(!tile)} title="3×3 タイルでシームレス確認 (T)">
            <Icon name="layers" className="h-3.5 w-3.5" />タイル
          </Btn>
          <Btn size="sm" active={view3d} accent="#f5a63c" onClick={() => onView3d(!view3d)} title="3D マイクラブロックプレビュー (3)">
            <Icon name="cube" className="h-3.5 w-3.5" />3Dブロック
          </Btn>
          <Btn size="sm" active={compare !== null} accent="#37d6c4" onClick={() => onCompare(compare === null ? 0.5 : null)} title="Before / After 比較 (C)">
            <Icon name="compare" className="h-3.5 w-3.5" />比較
          </Btn>
          <Btn size="sm" active={playing} accent="#f5a63c" onClick={() => onPlay(!playing)} title="アニメーション再生 (Space)" disabled={!animated}>
            <Icon name={playing ? "pause" : "play"} className="h-3.5 w-3.5" />{playing ? "停止" : "再生"}
          </Btn>
        </div>

        {compare !== null && (
          <div className="flex min-w-[150px] flex-1 items-center gap-2">
            <span className="font-bit text-[9px] uppercase tracking-[0.16em] text-[var(--teal)]">SPLIT</span>
            <input type="range" min={0} max={1} step={0.01} value={compare}
              onChange={(e) => onCompare(parseFloat(e.target.value))}
              style={{ ["--acc" as any]: "#37d6c4", ["--fill" as any]: `${compare * 100}%` }} />
            <span className="tabular font-bit text-[10px] text-[var(--ink2)]">{Math.round(compare * 100)}%</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3 font-bit text-[9.5px] uppercase tracking-[0.14em] text-[var(--ink3)]">
          <span className="hidden sm:inline">使用色 <b className="tabular text-[var(--amber)]">{colors}</b></span>
          <span className="hidden md:inline">不透明px <b className="tabular text-[var(--teal)]">{opaque}</b></span>
          <span>適用 <b className="tabular text-[var(--rose)]">{insts.filter((i) => i.on).length}</b>/{insts.length}</span>
          {hover && (
            <span className="flex items-center gap-1.5 rounded-[3px] border border-[var(--line2)] bg-[#0f131a] px-1.5 py-0.5 normal-case tracking-normal">
              <span className="h-3 w-3 rounded-[2px] border border-white/25"
                style={{ background: `rgba(${hover.rgba[0]},${hover.rgba[1]},${hover.rgba[2]},${(hover.rgba[3] / 255).toFixed(2)})` }} />
              <span className="tabular text-[10px] text-[var(--ink2)]">
                {hover.x},{hover.y} · {hover.rgba[0]},{hover.rgba[1]},{hover.rgba[2]},{hover.rgba[3]}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
