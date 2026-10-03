"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { CircleHelp, Grid2X2, ImageIcon, Layers3, Loader2, Scan, Sparkles, Upload, X, ArrowUpRight } from "lucide-react";
import {
  DEFAULT_VOXELIZE, SAMPLE_SPRITES, extrusionKey, importImageFile, importImageDataUrl, imageDataToPng, sampleAtlasPalette, sampleSprite,
  removeBorderBackground, toModelTexture, voxelizeFromImageData, type ImageDataLike, type ImportedTexture, type VoxelizeOptions,
} from "@/lib/atlas";
import { modelFromSprite, type VoxelModel } from "@/lib/models";
import ModelThumbnail from "./model-thumbnail";

type Mode = "atlas" | "sprite";
interface ImportedImage { data: ImageDataLike; source: string; name: string; width: number; height: number }
interface Props {
  tags: string[];
  texture: ImportedTexture | null;
  busy: boolean;
  generationError: string;
  onApplyAtlas: (texture: ImportedTexture) => Promise<boolean>;
  onVoxelize: (texture: ImportedTexture, model: VoxelModel) => Promise<boolean>;
  onPreview: (texture: ImportedTexture, model: VoxelModel) => void;
  onValidityChange: (valid: boolean) => void;
  onClear: () => void;
}
const SAMPLE_LABELS: Record<string, string> = { heart: "ハート", key: "かぎ", gem: "ジェム" };
const SLOT_LABELS = ["本体", "明部", "影", "深い影", "装飾", "柄・木", "輪郭", "光"];
const GRID_PRESETS = [[4, 2], [2, 4], [2, 2], [1, 1], [4, 4], [8, 8]];
const BASE_ITEMS = [["paper", "紙（飾り）"], ["iron_sword", "鉄の剣"], ["diamond_sword", "ダイヤの剣"], ["iron_pickaxe", "鉄のピッケル"], ["iron_axe", "鉄の斧"], ["bow", "弓（静止モデル）"], ["stick", "棒・杖"], ["trident", "トライデント（手持ち）"]];

export default function TextureStudio({ tags, texture, busy, generationError, onApplyAtlas, onVoxelize, onPreview, onValidityChange, onClear }: Props) {
  const [mode, setMode] = useState<Mode>("atlas");
  const [image, setImage] = useState<ImportedImage | null>(null);
  const [options, setOptions] = useState<VoxelizeOptions>({ ...DEFAULT_VOXELIZE });
  const [grid, setGrid] = useState([4, 2]);
  const [slots, setSlots] = useState(Array.from({ length: 8 }, (_, index) => index));
  const [baseItem, setBaseItem] = useState("paper");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadSequence = useRef(0);
  const restoring = useRef(false);
  const imageRef = useRef(image); imageRef.current = image;
  const previousActiveSource = useRef(texture?.source ?? null);
  useEffect(() => {
    if (!texture && previousActiveSource.current) { setImage(null); setError(""); }
    previousActiveSource.current = texture?.source ?? null;
  }, [texture?.source]);

  // A saved model restores its actual image, atlas mapping and extrusion parameters.
  useEffect(() => {
    if (!texture?.source || texture.source === imageRef.current?.source) return;
    const sequence = ++loadSequence.current;
    restoring.current = true;
    void importImageDataUrl(texture.source).then(imported => {
      if (sequence !== loadSequence.current) return;
      setImage({ data: imported.image, source: imported.source, name: texture.name, width: imported.image.width, height: imported.image.height });
      setMode(texture.kind);
      if (texture.kind === "sprite") { setOptions({ ...DEFAULT_VOXELIZE, ...texture.extrusion }); setBaseItem(texture.baseItem ?? "paper"); }
      else { setGrid([texture.cols ?? 4, texture.rows ?? 2]); setSlots(texture.slots ?? Array.from({ length: 8 }, (_, index) => index)); }
      restoring.current = false;
    }).catch(() => { restoring.current = false; setError("保存済み画像を読み込めませんでした。"); });
  }, [texture?.source]);

  const tilePalette = useMemo(() => image && mode === "atlas" ? sampleAtlasPalette(image.data, grid[0], grid[1]) : [], [image, mode, grid]);
  const palette = useMemo(() => tilePalette.length ? slots.map(slot => tilePalette[slot % tilePalette.length]) : null, [tilePalette, slots]);
  const voxelized = useMemo(() => image && mode === "sprite" ? voxelizeFromImageData(image.data, options) : null, [image, mode, options]);
  useEffect(() => { onValidityChange(!(mode === "sprite" && image && !voxelized?.cubes.length)); }, [mode, image, voxelized, onValidityChange]);
  const draft = useMemo(() => {
    if (!image || mode !== "sprite" || !voxelized?.cubes.length) return null;
    const source = options.removeBackground ? imageDataToPng(removeBorderBackground(image.data)) : image.source;
    const next: ImportedTexture = { source, kind: "sprite", width: image.width, height: image.height, palette: voxelized.palette, name: image.name, extrusion: { ...options }, baseItem };
    const model = modelFromSprite({
      name: `${image.name} モデル`.slice(0, 60), slugSeed: source + extrusionKey(options),
      cubes: voxelized.cubes, palette: voxelized.palette, texture: toModelTexture(next), tags, baseItem,
    });
    return { texture: next, model };
  }, [image, mode, voxelized, options, baseItem, tags]);
  useEffect(() => {
    if (!draft || busy || restoring.current) return;
    if (texture?.kind === "sprite" && draft.texture.source === texture.source && extrusionKey(draft.texture.extrusion) === extrusionKey(texture.extrusion) && baseItem === texture.baseItem) return;
    onPreview(draft.texture, draft.model);
  }, [draft, busy, texture, baseItem, onPreview]);

  const load = useCallback(async (file: File) => {
    const sequence = ++loadSequence.current;
    setWorking(true); setError("");
    try {
      const imported = await importImageFile(file);
      if (sequence !== loadSequence.current) return;
      setImage({ data: imported.image, source: imported.source, name: imported.name, width: imported.image.width, height: imported.image.height });
    } catch (err) { setError(err instanceof Error ? err.message : "画像を読み込めませんでした。"); }
    finally { if (sequence === loadSequence.current) setWorking(false); }
  }, []);
  const useSample = (name: string) => {
    loadSequence.current++; setError(""); setWorking(false); restoring.current = false;
    const data = sampleSprite(name);
    setImage({ data, source: imageDataToPng(data), name: SAMPLE_LABELS[name] ?? name, width: data.width, height: data.height });
    setMode("sprite");
  };
  const drop = (event: DragEvent) => {
    event.preventDefault(); setDragging(false);
    if (!busy && event.dataTransfer.files?.[0]) void load(event.dataTransfer.files[0]);
  };
  const applyAtlas = async () => {
    if (!image || !palette) return;
    const next: ImportedTexture = { source: image.source, kind: "atlas", width: image.width, height: image.height, palette, name: image.name, cols: grid[0], rows: grid[1], slots: [...slots] };
    const saved = await onApplyAtlas(next);
    if (saved) document.querySelector(".preview-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const clearImage = () => { loadSequence.current++; setImage(null); setError(""); onClear(); if (fileRef.current) fileRef.current.value = ""; };

  return <section className="texture-studio panel" aria-label="テクスチャからモデルをつくる">
    <header className="panel-heading"><span className="panel-title"><ImageIcon size={16} />画像からつくる</span>
      <div className="texture-mode-tabs" role="tablist" aria-label="テクスチャの取り込み方法">
        <button role="tab" aria-selected={mode === "atlas"} className={mode === "atlas" ? "selected" : ""} onClick={() => setMode("atlas")}><Grid2X2 size={12} />UVアトラス</button>
        <button role="tab" aria-selected={mode === "sprite"} className={mode === "sprite" ? "selected" : ""} onClick={() => setMode("sprite")}><Scan size={13} />2Dテクスチャ→3D</button>
      </div>
    </header>
    <div className="texture-studio-body">
      <div className="texture-drop-column">
        <div className={dragging ? "texture-dropzone dragging" : "texture-dropzone"}
          role="button" tabIndex={busy ? -1 : 0} aria-label="テクスチャ画像を選択"
          onClick={event => { if (!busy && !(event.target as HTMLElement).closest("button,input")) fileRef.current?.click(); }}
          onKeyDown={event => { if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) { event.preventDefault(); fileRef.current?.click(); } }}
          onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}>
          {working ? <span className="dropzone-busy"><Loader2 size={18} className="spin" />画像を読み込み中</span> : image ? <>
            <div className="texture-canvas" style={{ width: 160 * Math.min(1, image.width / image.height), height: 160 * Math.min(1, image.height / image.width) }}>
              <img src={image.source} alt={`${image.name} のプレビュー`} width={image.width} height={image.height} />
              {mode === "atlas" && <div className="atlas-slots" style={{ gridTemplateColumns: `repeat(${grid[0]},1fr)`, gridTemplateRows: `repeat(${grid[1]},1fr)` }} aria-hidden="true">{tilePalette.map((color, index) => <span key={index}><i>{index + 1}</i><em style={{ background: color }} /></span>)}</div>}
            </div>
            <div className="texture-file-meta"><span>{image.name}.png</span><span>{image.width} × {image.height}</span><button onClick={event => { event.stopPropagation(); clearImage(); }} aria-label="画像を取り消す"><X size={12} /></button></div>
          </> : <span className="dropzone-idle"><Upload size={18} />画像をドラッグ＆ドロップ<br />この枠をクリックして選択</span>}
          <input ref={fileRef} id="texture-file" type="file" disabled={busy} accept="image/png,image/jpeg,image/webp" onChange={event => { const file = event.target.files?.[0]; if (file) void load(file); }} />
          <button className="dropzone-browse" disabled={busy} onClick={() => fileRef.current?.click()}>画像を選択</button>
        </div>
        {mode === "sprite" && <div className="sample-sprites"><span>まず試す</span>{SAMPLE_SPRITES.map(name => <button key={name} onClick={() => useSample(name)} disabled={working || busy}>{SAMPLE_LABELS[name]}</button>)}</div>}
        {draft && <div className="extrusion-mini"><ModelThumbnail model={draft.model} /><span>押し出し形状（色は近似）</span><button onClick={() => document.querySelector(".preview-panel")?.scrollIntoView({ behavior: "smooth", block: "center" })}>3Dプレビューで確認<ArrowUpRight size={12} /></button></div>}
        {(error || generationError) && <div className="form-error" role="alert"><CircleHelp size={13} /><span>{error || generationError}</span></div>}
      </div>
      <div className="texture-options">
        {mode === "atlas" ? <>
          <p className="texture-lead">タイル状の画像を、タグで生成した形状の素材に割り当てます。分割と素材の対応を指定してください。</p>
          <p className="texture-limit-note"><CircleHelp size={13} />画像だけから元の3D形状・任意のUV展開図を復元する機能ではありません。</p>
          <div className="option-row"><label className="option-label" htmlFor="atlas-grid">画像の分割</label><select id="atlas-grid" aria-label="UVアトラスの分割数" value={grid.join("x")} onChange={event => { const values = event.target.value.split("x").map(Number); setGrid(values); setSlots(Array.from({ length: 8 }, (_, index) => index % (values[0] * values[1]))); }}>{GRID_PRESETS.map(([cols, rows]) => <option key={`${cols}x${rows}`} value={`${cols}x${rows}`}>{cols} × {rows}</option>)}</select></div>
          <div className="atlas-assignment">{SLOT_LABELS.map((label, index) => <label key={label}><span className="atlas-color-dot" style={palette ? { background: palette[index] } : undefined} /><span>{label}</span><select aria-label={`${label}のUVタイル`} value={slots[index] % (grid[0] * grid[1])} onChange={event => setSlots(current => current.map((slot, i) => i === index ? Number(event.target.value) : slot))}>{Array.from({ length: grid[0] * grid[1] }, (_, i) => <option value={i} key={i}>タイル {i + 1}</option>)}</select></label>)}</div>
          <div className="texture-action-row"><button className="generate-button small" onClick={() => void applyAtlas()} disabled={!palette || busy || working}>{busy ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}<span>アトラスを適用して生成</span></button>{texture?.kind === "atlas" && <button className="ghost-button" onClick={onClear}>解除</button>}</div>
          <p className="texture-note">元の画像、分割、素材割り当てをモデルと一緒に保存・書き出しします。色タグで画像の色は変わりません。</p>
        </> : <>
          <p className="texture-lead">不透明な輪郭に厚みを付ける「押し出し」です。入力の縦横比と元の色を保ちます。写真の背面や見えない奥行きの推定は行いません。</p>
          <div className="option-row"><label className="option-label" htmlFor="sprite-grid">輪郭の解像度</label><select id="sprite-grid" aria-label="輪郭の解像度" value={options.gridSize ?? "native"} onChange={event => setOptions({ ...options, gridSize: event.target.value === "native" ? "native" : Number(event.target.value) as 16 | 32 | 64 })}><option value="native">元のピクセル（最大64px）</option><option value="16">最大16px</option><option value="32">最大32px</option><option value="64">最大64px</option></select></div>
          <div className="option-row"><span className="option-label">厚み</span><div className="segmented" role="group" aria-label="押し出しの厚み">{[.5, 1, 2, 4].map(depth => <button key={depth} aria-pressed={options.depth === depth} className={options.depth === depth ? "selected" : ""} onClick={() => setOptions({ ...options, depth })}>{depth}</button>)}</div></div>
          <div className="option-row"><span className="option-label">透明のしきい値<em>{options.alphaThreshold}</em></span><input type="range" aria-label="透明とみなすしきい値" min="0" max="255" value={options.alphaThreshold} style={{ "--range-progress": `${options.alphaThreshold / 255 * 100}%` } as CSSProperties} onChange={event => setOptions({ ...options, alphaThreshold: Number(event.target.value) })} /></div>
          <label className="option-toggle"><input type="checkbox" checked={!!options.removeBackground} onChange={event => setOptions({ ...options, removeBackground: event.target.checked })} /><span>単色の背景を除去（画像の端から）</span></label>
          <label className="option-toggle"><input type="checkbox" checked={options.glowThreshold !== null} onChange={event => setOptions({ ...options, glowThreshold: event.target.checked ? .86 : null })} /><span>明るいピクセルを発光させる</span></label>
          <label className="option-toggle"><input type="checkbox" checked={options.mergeRuns} onChange={event => setOptions({ ...options, mergeRuns: event.target.checked })} /><span>輪郭を保ってエレメントを結合</span></label>
          <div className="option-row"><label className="option-label" htmlFor="sprite-base">ゲームでの用途</label><select id="sprite-base" aria-label="画像モデルの元アイテム" value={baseItem} onChange={event => setBaseItem(event.target.value)}>{BASE_ITEMS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          {baseItem === "bow" && <p className="texture-limit-note">画像の弓は静止モデルです。引く動作のモデルはタグの弓生成をご利用ください。</p>}
          <div className="voxel-stats" aria-live="polite">{voxelized ? <><span><Layers3 size={12} /><strong>{voxelized.cubes.length}</strong> エレメント</span><span><strong>{voxelized.gridWidth} × {voxelized.gridHeight}</strong> 輪郭</span><span><strong>{voxelized.colorCount}</strong> 色</span></> : <span>画像を読み込むとプレビューを更新します。</span>}</div>
          {image && !voxelized?.cubes.length && <p className="texture-limit-note">表示できるピクセルがありません。透明のしきい値を下げてください。</p>}
          <div className="texture-action-row"><button className="generate-button small" onClick={() => { if (draft) void onVoxelize(draft.texture, draft.model); }} disabled={!draft || busy || working}>{busy ? <Loader2 size={14} className="spin" /> : <Scan size={14} />}<span>立体化して保存</span></button>{texture?.kind === "sprite" && <button className="ghost-button" onClick={clearImage}>解除</button>}</div>
          <p className="texture-note">16/32/64pxのドット絵に適しています。画像変更・厚み変更は保存前にもプレビューへ反映されます。</p>
        </>}
      </div>
    </div>
  </section>;
}
