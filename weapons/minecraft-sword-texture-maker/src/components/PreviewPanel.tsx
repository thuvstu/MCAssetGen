import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { SwordOptions } from "../engine/types";
import { DETAIL_LEVELS } from "../engine/options";
import { BLADE_LABELS, ELEMENT_ACCENTS, ELEMENT_LABELS } from "../generator/catalog";
import { Icon } from "./Icon";

type Props = {
  canvasRef: RefObject<HTMLCanvasElement | null>; options: SwordOptions; name: string;
  playing: boolean; onPlaying: (playing: boolean) => void;
  update: (patch: Partial<SwordOptions>) => void;
  paletteLocked: boolean; onPaletteLock: () => void; onPaletteEdit: () => void;
  generating: boolean;
};

export default function PreviewPanel({ canvasRef, options, name, playing, onPlaying, update, paletteLocked, onPaletteLock, onPaletteEdit, generating }: Props) {
  const [background, setBackground] = useState("dark");
  const [grid, setGrid] = useState(false);
  const [actualSize, setActualSize] = useState(false);
  const title = name.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const accent = ELEMENT_ACCENTS[options.element];

  return <section className={`preview-panel ${generating ? "is-generating" : ""}`} aria-label="テクスチャのプレビュー">
    <div className="preview-toolbar"><span className="eyebrow">LIVE PREVIEW</span>
      <div className="preview-tools">
        <div className="background-control" aria-label="背景色">
          {([{ id: "dark", label: "ダーク背景", color: "#171b25" }, { id: "checker", label: "透過チェック背景", color: "checker" }, { id: "light", label: "ライト背景", color: "#cdd2db" }]).map((bg) => <button key={bg.id} className={`${background === bg.id ? "selected" : ""} ${bg.id === "checker" ? "checker-swatch" : ""}`} style={bg.id !== "checker" ? { background: bg.color } : undefined} aria-label={bg.label} aria-pressed={background === bg.id} title={bg.label} onClick={() => setBackground(bg.id)} />)}
        </div>
        <span className="toolbar-divider" />
        <button className={`tool-button ${grid ? "active" : ""}`} aria-pressed={grid} aria-label="ピクセルグリッドを表示" title="ピクセルグリッド" onClick={() => setGrid(!grid)}><Icon name="grid" size={16} /></button>
        <button className={`tool-button ${playing ? "active" : ""}`} aria-pressed={playing} aria-label={playing ? "アニメーションを停止" : "アニメーションを再生"} title={playing ? "停止" : "再生"} onClick={() => onPlaying(!playing)}><Icon name={playing ? "pause" : "play"} size={15} /></button>
      </div>
    </div>

    <div className={`preview-stage bg-${background} ${actualSize ? "actual-size" : ""}`}>
      {options.auraBloom && background === "dark" && <div className="preview-aura" style={{ background: `radial-gradient(ellipse at center, ${accent}12, transparent 65%)` }} />}
      <div className="stage-axis stage-axis-x" /><div className="stage-axis stage-axis-y" />
      <div className="stage-coordinate">Y</div><div className="stage-coordinate-x">X</div>
      <div className="artboard" style={actualSize ? { width: options.size, maxWidth: "none", flexShrink: 0 } : { maxWidth: 340 }}>
        <i className="artboard-corner top-left" /><i className="artboard-corner top-right" /><i className="artboard-corner bottom-left" /><i className="artboard-corner bottom-right" />
        <canvas ref={canvasRef} width={options.size} height={options.size} className="sword-canvas" style={{ imageRendering: options.antiAlias ? "auto" : "pixelated" }} role="img" aria-label={`${title}、${BLADE_LABELS[options.silhouette]}、${ELEMENT_LABELS[options.element]}の剣テクスチャ`} />
        {grid && <div className="pixel-grid" style={{ backgroundSize: `${100 / options.size}% ${100 / options.size}%` }} />}
      </div>
      <div className="stage-bottom"><span><i className={playing ? "live-dot" : "paused-dot"} />{playing ? "ANIMATED" : "PAUSED"}</span><button onClick={() => setActualSize(!actualSize)} title="原寸 / フィット表示">{actualSize ? "1:1" : "FIT"}<Icon name="chevron" size={10} /></button></div>
    </div>

    <div className="preview-caption">
      <div><h2>{title || "Untitled Blade"}</h2><p><span style={{ color: accent }}>{ELEMENT_LABELS[options.element]}</span><span>/</span>{BLADE_LABELS[options.silhouette]}<span>/</span>透過 PNG</p></div>
      <MiniCanvas source={canvasRef} options={options} playing={playing} />
    </div>

    <div className="preview-format">
      <label><span className="format-label">解像度</span><select aria-label="書き出し解像度" value={options.size} onChange={(e) => update({ size: Number(e.target.value) })}>{[16, 32, 64, 128, 256, 512].map((size) => <option key={size} value={size}>{size} x {size}</option>)}</select></label>
      <label><span className="format-label">描画</span><select aria-label="描画スタイル" value={options.detailLevel} onChange={(e) => update({ detailLevel: e.target.value as SwordOptions["detailLevel"] })}>{DETAIL_LEVELS.map((d) => <option key={d.id} value={d.id} title={d.desc}>{d.label}</option>)}</select></label>
      <span className="output-label">常に維持</span>
    </div>

    <div className="preview-palette"><div><span className="eyebrow">COLOR STORY</span><div className="palette-swatches">{(["blade", "bladeEdge", "guard", "handle", "outline"] as const).map((key) => <button key={key} style={{ background: options.palette[key] }} title={`${key}: ${options.palette[key]}`} aria-label={`${key}の色を編集`} onClick={onPaletteEdit} />)}</div></div>
      <button className={`palette-lock ${paletteLocked ? "active" : ""}`} onClick={onPaletteLock} aria-pressed={paletteLocked}><Icon name={paletteLocked ? "lock" : "unlock"} size={14} />{paletteLocked ? "配色を固定中" : "この配色を固定"}</button>
    </div>
    <p className="preview-disclaimer">背景とオーラはプレビュー専用です。書き出し画像には含まれません。</p>
  </section>;
}

function MiniCanvas({ source, options, playing }: { source: RefObject<HTMLCanvasElement | null>; options: SwordOptions; playing: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0, last = 0;
    const draw = (now: number) => {
      if (playing) raf = requestAnimationFrame(draw);
      if (now - last < 1000 / 15) return;
      last = now;
      const canvas = ref.current, main = source.current;
      if (!canvas || !main) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 32, 32);
      ctx.drawImage(main, 0, 0, 32, 32);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [source, options, playing]);
  return <div className="inventory-preview" title="32pxのインベントリ表示イメージ"><div className="inventory-slot"><canvas ref={ref} width={32} height={32} style={{ width: 32, height: 32, imageRendering: "pixelated" }} aria-label="32pxのプレビュー" /></div><span>32px</span></div>;
}