import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { EditorTool, PaletteEntry, PixelCell, TextureInput } from "../types/model";

interface PixelEditorProps {
  texture: TextureInput;
  textureWidth: number;
  textureHeight: number;
  pixels: PixelCell[];
  palette: PaletteEntry[];
  depthOverrides: Map<string, number>;
  emissiveOverrides: Set<string>;
  onUpdateTexture: (nextTexture: TextureInput) => void;
  onUpdateDepthOverride: (key: string, depth: number | null) => void;
  onToggleEmissive: (key: string, forceState?: boolean) => void;
  onTransformOverrides: (
    mode: "flipH" | "flipV" | "rot90",
    width: number,
    height: number,
    nextWidth: number,
    nextHeight: number,
  ) => void;
  onClearOverrides: () => void;
}

const RENDER_SCALE = 24;
const HISTORY_LIMIT = 24;

function cloneCanvas(source: HTMLCanvasElement) {
  const copy = document.createElement("canvas");
  copy.width = source.width;
  copy.height = source.height;
  copy.getContext("2d")?.drawImage(source, 0, 0);
  return copy;
}

export function PixelEditor({
  texture,
  textureWidth,
  textureHeight,
  pixels,
  palette,
  depthOverrides,
  emissiveOverrides,
  onUpdateTexture,
  onUpdateDepthOverride,
  onToggleEmissive,
  onTransformOverrides,
  onClearOverrides,
}: PixelEditorProps) {
  const [tool, setTool] = useState<EditorTool>("brush");
  const [brushColor, setBrushColor] = useState("#d4f47e");
  const [brushDepth, setBrushDepth] = useState(6);
  const [mirrorMode, setMirrorMode] = useState(false);
  const [showDepths, setShowDepths] = useState(true);
  const [historyDepth, setHistoryDepth] = useState({ undo: 0, redo: 0 });
  const workingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const undoStackRef = useRef<HTMLCanvasElement[]>([]);
  const redoStackRef = useRef<HTMLCanvasElement[]>([]);
  const paintingRef = useRef(false);
  const changedTextureRef = useRef(false);
  const lastCellRef = useRef("");

  const pixelLookup = new Map(pixels.map((pixel) => [`${pixel.col}:${pixel.row}`, pixel]));

  const drawPreview = useCallback(() => {
    const working = workingCanvasRef.current;
    const canvas = displayCanvasRef.current;
    if (!working || !canvas) return;

    const cellSize = textureWidth > 24 ? 16 : RENDER_SCALE;
    canvas.width = textureWidth * cellSize;
    canvas.height = textureHeight * cellSize;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    context.drawImage(working, 0, 0, canvas.width, canvas.height);

    if (textureWidth <= 32) {
      context.save();
      context.lineWidth = 1;
      context.strokeStyle = "rgba(10, 14, 11, 0.22)";
      for (let col = 0; col <= textureWidth; col += 1) {
        const x = col * cellSize + 0.5;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
      }
      for (let row = 0; row <= textureHeight; row += 1) {
        const y = row * cellSize + 0.5;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
      }

      pixels.forEach((pixel) => {
        const key = `${pixel.col}:${pixel.row}`;
        const x = pixel.col * cellSize;
        const y = pixel.row * cellSize;
        if (pixel.emissive || emissiveOverrides.has(key)) {
          context.strokeStyle = "rgba(255, 226, 126, 0.95)";
          context.lineWidth = Math.max(1, cellSize / 11);
          context.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        }
        if (showDepths && textureWidth <= 24) {
          const depth = depthOverrides.get(key) ?? pixel.depth;
          context.fillStyle = "rgba(10, 14, 11, 0.58)";
          context.fillRect(x + 2, y + 2, Math.max(12, cellSize * 0.48), Math.max(10, cellSize * 0.44));
          context.fillStyle = "#f4f3e7";
          context.font = `600 ${Math.max(8, cellSize * 0.38)}px ui-monospace, monospace`;
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(String(depth), x + cellSize * 0.25 + 2, y + cellSize * 0.23 + 2);
        }
      });
      context.restore();
    }

    if (mirrorMode) {
      const axis = (textureWidth / 2) * cellSize;
      context.save();
      context.strokeStyle = "rgba(212, 244, 126, 0.55)";
      context.setLineDash([6, 5]);
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(axis + 0.5, 0);
      context.lineTo(axis + 0.5, canvas.height);
      context.stroke();
      context.restore();
    }
  }, [
    depthOverrides,
    emissiveOverrides,
    mirrorMode,
    pixels,
    showDepths,
    textureHeight,
    textureWidth,
  ]);

  const syncHistoryCounters = () => {
    setHistoryDepth({ undo: undoStackRef.current.length, redo: redoStackRef.current.length });
  };

  useEffect(() => {
    const working = document.createElement("canvas");
    working.width = textureWidth;
    working.height = textureHeight;
    const context = working.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.clearRect(0, 0, textureWidth, textureHeight);
    context.imageSmoothingEnabled = texture.width > textureWidth || texture.height > textureHeight;
    context.imageSmoothingQuality = "high";
    context.drawImage(texture.source, 0, 0, textureWidth, textureHeight);
    workingCanvasRef.current = working;
    drawPreview();
  }, [drawPreview, texture, textureHeight, textureWidth]);

  const commitWorkingCanvas = () => {
    const working = workingCanvasRef.current;
    if (!working) return;
    onUpdateTexture({
      source: cloneCanvas(working),
      width: textureWidth,
      height: textureHeight,
      name: texture.name,
    });
  };

  const restoreFromStack = (from: HTMLCanvasElement[], to: HTMLCanvasElement[]) => {
    const source = from.pop();
    if (!source) return;
    const working = workingCanvasRef.current;
    if (working) to.push(cloneCanvas(working));
    workingCanvasRef.current = source;
    syncHistoryCounters();
    commitWorkingCanvas();
  };

  const cellFromPointer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    const col = Math.max(0, Math.min(textureWidth - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * textureWidth)));
    const row = Math.max(0, Math.min(textureHeight - 1, Math.floor(((event.clientY - bounds.top) / bounds.height) * textureHeight)));
    return { col, row, key: `${col}:${row}` };
  };

  const targetKeys = (col: number, row: number) => {
    const keys = [`${col}:${row}`];
    if (mirrorMode) keys.push(`${textureWidth - 1 - col}:${row}`);
    return keys;
  };

  const paintCell = (col: number, row: number) => {
    const working = workingCanvasRef.current;
    const context = working?.getContext("2d");
    if (!working || !context) return;
    if (tool === "eraser") context.clearRect(col, row, 1, 1);
    else if (tool === "brush") {
      context.fillStyle = brushColor;
      context.fillRect(col, row, 1, 1);
    }
    changedTextureRef.current = true;
  };

  const applyTool = (col: number, row: number, isDrag: boolean) => {
    const primaryKey = `${col}:${row}`;
    const keys = targetKeys(col, row);
    if (lastCellRef.current === primaryKey) return;
    lastCellRef.current = primaryKey;
    const cell = pixelLookup.get(primaryKey);

    if (tool === "eyedropper") {
      if (cell) {
        setBrushColor(cell.hex);
        setBrushDepth(depthOverrides.get(primaryKey) ?? cell.depth);
      }
      return;
    }

    if (tool === "depth") {
      keys.forEach((key) => {
        if (pixelLookup.has(key)) onUpdateDepthOverride(key, brushDepth);
      });
      return;
    }

    if (tool === "emissive") {
      keys.forEach((key) => {
        if (pixelLookup.has(key)) onToggleEmissive(key, isDrag ? true : !emissiveOverrides.has(key));
      });
      return;
    }

    keys.forEach((key) => {
      const [keyCol, keyRow] = key.split(":").map(Number);
      paintCell(keyCol, keyRow);
      if (tool === "eraser") {
        onUpdateDepthOverride(key, null);
        onToggleEmissive(key, false);
      }
    });
    drawPreview();
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const working = workingCanvasRef.current;
    if (working) {
      undoStackRef.current.push(cloneCanvas(working));
      if (undoStackRef.current.length > HISTORY_LIMIT) undoStackRef.current.shift();
      redoStackRef.current = [];
      syncHistoryCounters();
    }
    paintingRef.current = true;
    changedTextureRef.current = false;
    lastCellRef.current = "";
    event.currentTarget.setPointerCapture(event.pointerId);
    const cell = cellFromPointer(event);
    if (cell) applyTool(cell.col, cell.row, false);
    if (changedTextureRef.current) commitWorkingCanvas();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!paintingRef.current) return;
    const cell = cellFromPointer(event);
    if (cell) applyTool(cell.col, cell.row, true);
  };

  const finishPointer = () => {
    if (!paintingRef.current) return;
    paintingRef.current = false;
    lastCellRef.current = "";
    if (changedTextureRef.current) {
      changedTextureRef.current = false;
      commitWorkingCanvas();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) restoreFromStack(redoStackRef.current, undoStackRef.current);
      else restoreFromStack(undoStackRef.current, redoStackRef.current);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const transformTexture = (mode: "flipH" | "flipV" | "rot90") => {
    const working = workingCanvasRef.current;
    if (!working) return;
    const nextWidth = mode === "rot90" ? textureHeight : textureWidth;
    const nextHeight = mode === "rot90" ? textureWidth : textureHeight;
    const output = document.createElement("canvas");
    output.width = nextWidth;
    output.height = nextHeight;
    const context = output.getContext("2d");
    if (!context) return;
    context.save();
    if (mode === "flipH") {
      context.translate(nextWidth, 0);
      context.scale(-1, 1);
    } else if (mode === "flipV") {
      context.translate(0, nextHeight);
      context.scale(1, -1);
    } else {
      context.translate(nextWidth, 0);
      context.rotate(Math.PI / 2);
    }
    context.drawImage(working, 0, 0);
    context.restore();
    onTransformOverrides(mode, textureWidth, textureHeight, nextWidth, nextHeight);
    onUpdateTexture({ source: output, width: nextWidth, height: nextHeight, name: texture.name });
    undoStackRef.current = [];
    redoStackRef.current = [];
    syncHistoryCounters();
  };

  const tools: { id: EditorTool; label: string; glyph: string }[] = [
    { id: "brush", label: "描画", glyph: "✳" },
    { id: "eraser", label: "消しゴム", glyph: "⌫" },
    { id: "eyedropper", label: "スポイト", glyph: "◉" },
    { id: "depth", label: "深度", glyph: "Z" },
    { id: "emissive", label: "発光", glyph: "✦" },
  ];

  return (
    <div className="pixel-editor-wrap">
      <div className="editor-heading">
        <div><span className="studio-overline">TEXTURE PAINT</span><h3>ピクセル編集</h3></div>
        <div className="editor-dimensions"><span>{textureWidth} × {textureHeight}</span><small>PIXELS</small></div>
      </div>

      <div className="pixel-editor-toolbar">
        <div className="editor-tool-buttons" role="group" aria-label="テクスチャ編集ツール">
          {tools.map((item) => (
            <button key={item.id} type="button" className={tool === item.id ? "editor-tool-btn is-active" : "editor-tool-btn"} onClick={() => { setTool(item.id); lastCellRef.current = ""; }} aria-pressed={tool === item.id}>
              <span>{item.glyph}</span>{item.label}
            </button>
          ))}
        </div>
        <div className="editor-transform-actions">
          <button type="button" disabled={historyDepth.undo === 0} onClick={() => restoreFromStack(undoStackRef.current, redoStackRef.current)} title="ひとつ前の状態へ戻す">↶ 取り消す {historyDepth.undo > 0 && <small>{historyDepth.undo}</small>}</button>
          <button type="button" disabled={historyDepth.redo === 0} onClick={() => restoreFromStack(redoStackRef.current, undoStackRef.current)} title="取り消した操作をやり直す">↷ やり直す {historyDepth.redo > 0 && <small>{historyDepth.redo}</small>}</button>
          <button type="button" onClick={() => transformTexture("flipH")}>左右反転</button>
          <button type="button" onClick={() => transformTexture("flipV")}>上下反転</button>
          <button type="button" onClick={() => transformTexture("rot90")}>90°回転</button>
        </div>
      </div>

      <div className="pixel-editor-options">
        {tool === "depth" ? (
          <div className="editor-inline-setting"><span>ピクセル深度</span><strong>{brushDepth}</strong><input type="range" min="1" max="12" value={brushDepth} onChange={(event) => setBrushDepth(Number(event.currentTarget.value))} /><small>ドラッグで深度を塗る</small></div>
        ) : tool === "emissive" ? (
          <div className="editor-hint"><span className="emissive-spark">✦</span><span>ドラッグで発光ピクセルを設定 <small>Blockbench light_emission: 15</small></span></div>
        ) : (
          <div className="editor-palette-row">
            <label className="editor-color-picker"><input type="color" value={brushColor} onChange={(event) => setBrushColor(event.currentTarget.value)} /><span>{brushColor.toUpperCase()}</span></label>
            <div className="extracted-swatches">{palette.slice(0, 16).map((entry) => <button key={entry.hex} type="button" title={`${entry.hex} · ${entry.count} px`} className={brushColor.toLowerCase() === entry.hex ? "palette-swatch is-active" : "palette-swatch"} style={{ backgroundColor: entry.hex }} onClick={() => { setBrushColor(entry.hex); if (tool === "eraser") setTool("brush"); }} />)}</div>
          </div>
        )}
        <label className="mirror-toggle"><input type="checkbox" checked={mirrorMode} onChange={(event) => setMirrorMode(event.currentTarget.checked)} /> 左右ミラー</label>
        <label className="depth-label-toggle"><input type="checkbox" checked={showDepths} onChange={(event) => setShowDepths(event.currentTarget.checked)} /> 深度を表示</label>
        {(depthOverrides.size > 0 || emissiveOverrides.size > 0) && <button className="reset-override-btn" type="button" onClick={onClearOverrides}>編集をリセット</button>}
      </div>

      <div className="pixel-editor-stage">
        <div className="checkerboard" />
        <canvas
          ref={displayCanvasRef}
          className="pixel-paint-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={finishPointer}
          onLostPointerCapture={finishPointer}
          role="img"
          aria-label={`ピクセル編集キャンバス ${textureWidth} x ${textureHeight}`}
          style={{ maxWidth: textureWidth > 24 ? "min(100%, 700px)" : "min(100%, 600px)" }}
        />
      </div>

      <div className="pixel-editor-footer">
        <span><kbd>ドラッグ</kbd> でピクセルを編集{mirrorMode && " · ミラー有効"}</span>
        <span>{pixels.length} pixels <i /> 深度 {depthOverrides.size} <i /> 発光 {emissiveOverrides.size}</span>
        <span className="editor-revision">LIVE</span>
      </div>
    </div>
  );
}
