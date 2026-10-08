import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Grid2X2, Minus, Plus, X, Eraser, Paintbrush, PaintBucket, Layers } from "lucide-react";
import { getBlock } from "../lib/minecraft-data";
import { getCell, type PlacedBlock, type Structure } from "../lib/structure";

interface Props {
  open: boolean;
  structure: Structure;
  y: number;
  selectedBlock: PlacedBlock;
  mirrorLabel: string;
  onClose: () => void;
  onYChange: (y: number) => void;
  onStroke: (points: { x: number; z: number }[], y: number, erase: boolean) => void;
  onFillLayer: (y: number, erase: boolean) => void;
}

interface Stroke {
  erase: boolean;
  points: Map<string, { x: number; z: number }>;
}

/** ポインタ座標の下にあるセル (data-x / data-z) を取得。マウス・タッチ・ペン共通 */
function cellAtPoint(clientX: number, clientY: number): { x: number; z: number } | null {
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
  const cell = el?.closest<HTMLElement>("[data-cell]");
  if (!cell) return null;
  return { x: Number(cell.dataset.x), z: Number(cell.dataset.z) };
}

export default function LayerEditor({
  open,
  structure,
  y,
  selectedBlock,
  mirrorLabel,
  onClose,
  onYChange,
  onStroke,
  onFillLayer,
}: Props) {
  const strokeRef = useRef<Stroke | null>(null);
  const [, setTick] = useState(0);
  const [onion, setOnion] = useState(true);

  const [sx, sy, sz] = structure.size;
  const current = Math.max(0, Math.min(sy - 1, y));
  const selectedDef = getBlock(selectedBlock.id);

  const cells = useMemo(() => {
    const out: { x: number; z: number; block: PlacedBlock | null; below: PlacedBlock | null }[] = [];
    for (let z = 0; z < sz; z++)
      for (let x = 0; x < sx; x++)
        out.push({
          x,
          z,
          block: getCell(structure, x, current, z),
          below: current > 0 ? getCell(structure, x, current - 1, z) : null,
        });
    return out;
  }, [structure, current, sx, sz]);

  if (!open) return null;

  const addPoint = (x: number, z: number) => {
    const s = strokeRef.current;
    if (!s) return;
    const key = `${x},${z}`;
    if (s.points.has(key)) return;
    s.points.set(key, { x, z });
    setTick((t) => t + 1);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.button !== 2) return;
    const c = cellAtPoint(e.clientX, e.clientY);
    if (!c) return;
    e.preventDefault();
    strokeRef.current = { erase: e.button === 2, points: new Map() };
    addPoint(c.x, c.z);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!strokeRef.current) return;
    if (e.pointerType === "mouse" && e.buttons === 0) return;
    const c = cellAtPoint(e.clientX, e.clientY);
    if (c) addPoint(c.x, c.z);
  };

  /** ストローク終了 = 履歴1件として確定 */
  const endStroke = () => {
    const s = strokeRef.current;
    if (!s) return;
    strokeRef.current = null;
    if (s.points.size > 0) onStroke([...s.points.values()], current, s.erase);
    setTick((t) => t + 1);
  };

  const stroke = strokeRef.current;

  const confirmFill = (erase: boolean) => {
    if (erase && !window.confirm(`Y=${current} の全セルを消去しますか？（Ctrl+Z で戻せます）`)) return;
    onFillLayer(current, erase);
  };

  const layerCount = cells.reduce((n, c) => n + (c.block ? 1 : 0), 0);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-emerald-800/60 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <div className="mr-auto flex items-center gap-2">
            <Grid2X2 className="h-4 w-4 text-sky-400" />
            <div>
              <h2 className="text-sm font-black text-white">2Dレイヤーエディタ</h2>
              <p className="text-[10px] text-zinc-500">1ストローク = 取り消し1回分（Ctrl+Z 対応）</p>
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-900 p-0.5">
            <button
              onClick={() => onYChange(Math.max(0, current - 1))}
              disabled={current === 0}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
              title="下のレイヤー"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-20 px-2 text-center font-mono text-xs font-bold text-emerald-300">
              Y = {current} <span className="text-zinc-600">/ {sy - 1}</span>
            </span>
            <button
              onClick={() => onYChange(Math.min(sy - 1, current + 1))}
              disabled={current === sy - 1}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
              title="上のレイヤー"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => setOnion((v) => !v)}
            className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-[11px] transition ${
              onion ? "border-sky-700 bg-sky-950/50 text-sky-200" : "border-zinc-800 bg-zinc-900 text-zinc-500"
            }`}
            title="1つ下のレイヤーを薄く表示"
          >
            <Layers className="h-3 w-3" /> 下の層を透かす
          </button>

          <button
            onClick={() => confirmFill(false)}
            title="このレイヤー全体を選択中のブロックで塗る"
            className="flex items-center gap-1 rounded-md border border-emerald-800 bg-emerald-950/40 px-2 py-1.5 text-[11px] font-bold text-emerald-200 hover:bg-emerald-900/50"
          >
            <PaintBucket className="h-3 w-3" /> レイヤーを塗る
          </button>
          <button
            onClick={() => confirmFill(true)}
            title="このレイヤーを空気にする"
            className="flex items-center gap-1 rounded-md border border-red-900 bg-red-950/40 px-2 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-900/50"
          >
            <Eraser className="h-3 w-3" /> レイヤーを消去
          </button>

          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white" aria-label="閉じる">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-zinc-800 bg-zinc-900/40 px-4 py-2 text-[10px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Paintbrush className="h-3 w-3 text-emerald-400" /> 左ドラッグ: <span className="text-zinc-200">{selectedDef.ja}</span> を配置
          </span>
          <span className="flex items-center gap-1">
            <Eraser className="h-3 w-3 text-red-400" /> 右ドラッグ: 消去
          </span>
          {mirrorLabel && <span className="text-pink-300">対称: {mirrorLabel}（反転先にも複製）</span>}
          <span className="font-mono text-zinc-600">
            X: {sx} / Z: {sz} / この層のブロック: {layerCount}
          </span>
        </div>

        <div
          className="min-h-0 flex-1 overflow-auto bg-[#090d0b] p-4 mc-scroll"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
        >
          <div
            className="mx-auto grid w-max select-none overflow-hidden rounded border border-emerald-900/70 bg-zinc-950 shadow-[0_0_0_1px_rgba(6,78,59,0.25)]"
            style={{ gridTemplateColumns: `repeat(${sx}, minmax(20px, 28px))`, touchAction: "none" }}
          >
            {cells.map(({ x, z, block, below }) => {
              const painted = !!stroke && stroke.points.has(`${x},${z}`);
              const shown = painted && stroke ? (stroke.erase ? null : selectedBlock) : block;
              const def = shown ? getBlock(shown.id) : null;
              const belowDef = !shown && onion && below ? getBlock(below.id) : null;
              const isSelected = shown?.id === selectedBlock.id;
              return (
                <div
                  key={`${x}:${z}`}
                  data-cell=""
                  data-x={x}
                  data-z={z}
                  title={`[${x}, ${current}, ${z}] ${shown?.id ?? "minecraft:air"}${belowDef ? `\n↓ ${below!.id}` : ""}`}
                  className={`relative aspect-square cursor-crosshair border border-black/40 transition hover:brightness-125 ${
                    isSelected ? "ring-1 ring-inset ring-emerald-300" : ""
                  } ${painted ? "brightness-125" : ""}`}
                  style={{
                    background: def
                      ? def.transparent
                        ? `linear-gradient(135deg, ${def.color}a8, ${def.color}55)`
                        : `linear-gradient(135deg, ${def.color}, #00000045)`
                      : belowDef
                        ? `linear-gradient(135deg, ${belowDef.color}40, ${belowDef.color}22)`
                        : "repeating-conic-gradient(#161d19 0% 25%, #0f1512 0% 50%) 0 0 / 8px 8px",
                  }}
                >
                  {(x === 0 || z === 0) && (
                    <span className="pointer-events-none absolute left-0 top-0 font-mono text-[7px] leading-none text-white/35">
                      {x === 0 ? z : x}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2 text-[10px] text-zinc-500">
          <span>ドラッグ中はプレビュー表示され、離した時点で1回分の履歴になります。タッチ操作にも対応。</span>
          <span className="font-mono">{sx * sz} cells / layer</span>
        </div>
      </div>
    </div>
  );
}
