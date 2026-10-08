import { useState, useRef, useEffect, useMemo } from "react";
import type { MobDraft } from "@/types";
import type { FaceName } from "@/lib/texture";
import { resolveParts } from "@/lib/model";
import { cn } from "@/utils/cn";

export function TexturePainter({
  mob,
  onChange,
}: {
  mob: MobDraft;
  onChange: (patch: Partial<MobDraft>) => void;
}) {
  const parts = useMemo(() => resolveParts(mob), [mob]);
  const [selectedPartId, setSelectedPartId] = useState<string>(parts[0]?.def.id ?? "");
  const [selectedFace, setSelectedFace] = useState<FaceName>("north");
  const [brushColor, setBrushColor] = useState<string>(mob.colors.accent);

  const selectedPart = useMemo(() => parts.find((p) => p.def.id === selectedPartId) ?? parts[0], [parts, selectedPartId]);

  // ピクセル解像度 (幅・高さ)
  const faceDims = useMemo(() => {
    if (!selectedPart) return { w: 8, h: 8 };
    const s = selectedPart.size;
    const w = Math.max(2, Math.min(16, Math.round(s[0])));
    const h = Math.max(2, Math.min(16, Math.round(s[1])));
    const d = Math.max(2, Math.min(16, Math.round(s[2])));
    if (selectedFace === "up" || selectedFace === "down") return { w, h: d };
    if (selectedFace === "east" || selectedFace === "west") return { w: d, h };
    return { w, h };
  }, [selectedPart, selectedFace]);

  // 内部ピクセルグリッド状態
  const [grid, setGrid] = useState<string[][]>([]);

  useEffect(() => {
    const baseColor = mob.partTint[selectedPartId] || selectedPart?.color || mob.colors.primary;
    const newGrid: string[][] = [];
    for (let y = 0; y < faceDims.h; y++) {
      const row: string[] = [];
      for (let x = 0; x < faceDims.w; x++) {
        row.push(baseColor);
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  }, [selectedPartId, selectedFace, faceDims, mob.partTint, selectedPart?.color, mob.colors.primary]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cellSize = Math.floor(220 / Math.max(faceDims.w, faceDims.h));
    canvas.width = faceDims.w * cellSize;
    canvas.height = faceDims.h * cellSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < faceDims.h; y++) {
      for (let x = 0; x < faceDims.w; x++) {
        ctx.fillStyle = grid[y]?.[x] || "#333333";
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }, [grid, faceDims]);

  const paintCell = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const cellSize = Math.floor(220 / Math.max(faceDims.w, faceDims.h));
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);

    if (cellX >= 0 && cellX < faceDims.w && cellY >= 0 && cellY < faceDims.h) {
      setGrid((prev) => {
        const copy = prev.map((row) => [...row]);
        if (copy[cellY]) {
          copy[cellY][cellX] = brushColor;
        }
        return copy;
      });
      // モブのティントを更新
      onChange({
        partTint: {
          ...mob.partTint,
          [selectedPartId]: brushColor,
        },
      });
    }
  };

  const isMouseDown = useRef(false);

  // ノイズテクスチャ適用
  const applyNoise = () => {
    const baseColor = mob.partTint[selectedPartId] || selectedPart?.color || mob.colors.primary;
    setGrid((prev) =>
      prev.map((row) =>
        row.map(() => {
          const factor = 0.85 + Math.random() * 0.3;
          const hex = baseColor.replace("#", "");
          const r = Math.min(255, Math.max(0, Math.round(parseInt(hex.slice(0, 2), 16) * factor)));
          const g = Math.min(255, Math.max(0, Math.round(parseInt(hex.slice(2, 4), 16) * factor)));
          const b = Math.min(255, Math.max(0, Math.round(parseInt(hex.slice(4, 6), 16) * factor)));
          return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        })
      )
    );
  };

  const quickColors = [
    mob.colors.primary,
    mob.colors.secondary,
    mob.colors.accent,
    mob.colors.skin,
    mob.colors.eye,
    mob.colors.detail,
    "#ffffff",
    "#000000",
  ];

  return (
    <div className="space-y-4 rounded-xl border border-line bg-ink/60 p-3.5">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-emerald">PIXEL PAINTER</div>
          <h3 className="text-sm font-bold text-cream">テクスチャ＆面ペインター</h3>
        </div>
        <button
          type="button"
          onClick={applyNoise}
          className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs text-gold hover:border-gold/40"
        >
          ✨ バニラ風ノイズ付加
        </button>
      </div>

      {/* 部位選択 */}
      <div>
        <div className="mb-1 text-[11px] text-muted">編集する部位:</div>
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto mf-scroll">
          {parts.map((p) => (
            <button
              key={p.def.id}
              type="button"
              onClick={() => setSelectedPartId(p.def.id)}
              className={cn(
                "rounded px-2 py-1 text-xs transition",
                selectedPartId === p.def.id
                  ? "bg-emerald text-ink font-bold"
                  : "bg-panel border border-line text-cream hover:bg-white/5"
              )}
            >
              {p.def.name}
            </button>
          ))}
        </div>
      </div>

      {/* 面選択 */}
      <div>
        <div className="mb-1 text-[11px] text-muted">ペイント面:</div>
        <div className="grid grid-cols-6 gap-1 text-center text-xs">
          {(
            [
              ["north", "正面 (北)"],
              ["south", "背面 (南)"],
              ["east", "右面 (東)"],
              ["west", "左面 (西)"],
              ["up", "天面 (上)"],
              ["down", "底面 (下)"],
            ] as const
          ).map(([face, label]) => (
            <button
              key={face}
              type="button"
              onClick={() => setSelectedFace(face)}
              className={cn(
                "rounded border py-1 font-mono text-[11px]",
                selectedFace === face
                  ? "border-gold/60 bg-gold/15 text-gold font-bold"
                  : "border-line bg-panel text-muted hover:text-cream"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* パレット＆ブラシ */}
      <div className="flex items-center gap-2">
        <div className="text-[11px] text-muted">ブラシ:</div>
        <input
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          className="h-7 w-8 cursor-pointer rounded border border-line bg-transparent"
        />
        <div className="flex flex-wrap gap-1">
          {quickColors.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setBrushColor(c)}
              className="h-6 w-6 rounded-full border border-black/40 ring-1 ring-white/10"
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      {/* ピクセルキャンバス */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-line/80 bg-panel/80 p-4">
        <canvas
          ref={canvasRef}
          onMouseDown={(e) => {
            isMouseDown.current = true;
            paintCell(e.clientX, e.clientY);
          }}
          onMouseMove={(e) => {
            if (isMouseDown.current) paintCell(e.clientX, e.clientY);
          }}
          onMouseUp={() => {
            isMouseDown.current = false;
          }}
          onMouseLeave={() => {
            isMouseDown.current = false;
          }}
          className="cursor-crosshair rounded shadow-lg image-rendering-pixelated border border-line"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="mt-2 text-[10px] text-muted">
          ドラッグしてピクセルを直接ドット打ち（解像度: {faceDims.w}×{faceDims.h}）
        </div>
      </div>
    </div>
  );
}
