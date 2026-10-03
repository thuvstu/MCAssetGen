import { useState, useRef, useEffect } from "react";
import { Grid, Eye, EyeOff, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface SeamlessTilingPreviewProps {
  canvas: HTMLCanvasElement | null;
}

export function SeamlessTilingPreview({ canvas }: SeamlessTilingPreviewProps) {
  const [gridSize, setGridSize] = useState<number>(4); // 4x4 blocks
  const [showBorders, setShowBorders] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvas || !previewCanvasRef.current) return;
    const dest = previewCanvasRef.current;
    const ctx = dest.getContext("2d")!;

    const bSize = 64; // render each block at 64x64 for crisp inspection
    dest.width = bSize * gridSize;
    dest.height = bSize * gridSize;

    ctx.imageSmoothingEnabled = false; // preserve crisp pixels

    // Draw tiled blocks
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, x * bSize, y * bSize, bSize, bSize);
      }
    }

    // Optional border overlay to distinguish blocks vs seamless view
    if (showBorders) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= gridSize; i++) {
        ctx.moveTo(i * bSize + 0.5, 0);
        ctx.lineTo(i * bSize + 0.5, dest.height);
        ctx.moveTo(0, i * bSize + 0.5);
        ctx.lineTo(dest.width, i * bSize + 0.5);
      }
      ctx.stroke();
    }
  }, [canvas, gridSize, showBorders]);

  return (
    <div className="flex flex-col h-full bg-[#171622] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white/5 border-b border-white/10 text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <Grid className="w-4 h-4" /> 建築タイリング・シームレス検証
          </span>
          <span className="text-zinc-500 text-[11px] hidden sm:inline">
            (壁一面に敷き詰めたときの継ぎ目をチェック)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid Count */}
          <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
            <span className="text-zinc-400">配置:</span>
            {[2, 3, 4, 6].map((sz) => (
              <button
                key={sz}
                onClick={() => setGridSize(sz)}
                className={`px-2 py-0.5 rounded text-xs transition ${
                  gridSize === sz ? "bg-emerald-600 text-white font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                {sz}×{sz}
              </button>
            ))}
          </div>

          {/* Border Toggle */}
          <button
            onClick={() => setShowBorders(!showBorders)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition ${
              showBorders
                ? "bg-zinc-800 border-emerald-500/50 text-emerald-300"
                : "bg-black/40 border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            {showBorders ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            境界線: {showBorders ? "ON" : "OFF (完全シームレス)"}
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-black/40 rounded-lg border border-white/10 p-0.5">
            <button
              onClick={() => setZoom(Math.max(0.6, zoom - 0.2))}
              className="p-1 hover:text-white text-zinc-400"
              title="縮小"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 font-mono text-[11px]">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(1.8, zoom + 0.2))}
              className="p-1 hover:text-white text-zinc-400"
              title="拡大"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 hover:text-white text-zinc-400 border-l border-white/10 ml-0.5"
              title="等倍に戻す"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas container */}
      <div className="flex-1 min-h-[380px] p-6 flex items-center justify-center overflow-auto bg-[#100f17]">
        <div
          className="shadow-2xl transition-transform duration-100 ease-out border border-black/40 rounded"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
            imageRendering: "pixelated",
          }}
        >
          <canvas ref={previewCanvasRef} className="block rounded shadow-lg" />
        </div>
      </div>

      {/* Footer tips */}
      <div className="px-4 py-2 bg-black/40 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
        <div>💡 「境界線: OFF」にすると、建築時の自然なリピートテクスチャの美しさを直接確認できます。</div>
        <div className="font-mono text-[11px] text-zinc-500">
          合計 {gridSize * gridSize} 個のブロック
        </div>
      </div>
    </div>
  );
}
