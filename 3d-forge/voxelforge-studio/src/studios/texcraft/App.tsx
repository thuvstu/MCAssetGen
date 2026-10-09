"use client";

import "./studio.css";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Box, Check, ChevronDown, ChevronRight, CircleAlert, CircleHelp, Columns2, Dices, Download, Eraser, Eye, FileDown, Film, FlipHorizontal, FolderOpen, Grid2X2, Grid3X3, Hand, Layers, LoaderCircle, Maximize2, Minus, Moon, MoreHorizontal, PaintBucket, PanelLeft, Pause, Pencil, Pipette, Play, Plus, Redo2, RotateCcw, ScanLine, ShieldCheck, SlidersHorizontal, Sparkles, Sun, Trash2, Undo2, Upload, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BrandMark } from './components/Icons';
import PixelCanvas, { Tool, ViewMode } from './components/PixelCanvas';
import LayerPanel from './components/LayerPanel';
import PartsPanel from './components/PartsPanel';
import WeaponPanel from './components/WeaponPanel';
import McPackDialog from './components/McPackDialog';
import ConvertDialog from './components/ConvertDialog';
import { Block3D, TilePreview } from './components/Previews';
import TextureLibrary, { ImportedAsset } from './components/TextureLibrary';
import { EffectLibrary, PresetLibrary, smartParams } from './components/EffectLibrary';
import Modal from './components/Modal';
import HelpDialog from './components/HelpDialog';
import ForgeLab from './components/ForgeLab';
import { WorkshopState, defaultWorkshopState } from './lib/workshopTypes';
import { ExportDialog, ImportDialog, NewDialog, PendingImage } from './components/Dialogs';
import { Layer, applyStack, isLayerAnimated, newLayer, randomLayers } from './lib/effects';
import { Preset, presetLayers } from './lib/presets';
import { Sample } from './lib/samples';
import { EditorDoc, STORAGE_KEY, parseProject, serializeProject, useDocHistory } from './lib/project';
import { RESOLUTIONS, Tex, downloadBlob, fitTex, loadImageFile, rgbToHex, texToDataURL } from './lib/tex';

const TOOLS: { id: Tool; Icon: LucideIcon; name: string; key: string }[] = [
  { id: 'hand', Icon: Hand, name: '移動', key: 'H' },
  { id: 'pencil', Icon: Pencil, name: 'ペン', key: 'B' },
  { id: 'eraser', Icon: Eraser, name: '消しゴム', key: 'E' },
  { id: 'fill', Icon: PaintBucket, name: '塗りつぶし', key: 'G' },
  { id: 'picker', Icon: Pipette, name: 'スポイト', key: 'I' },
  { id: 'dodge', Icon: Sun, name: '明るくする', key: 'O' },
  { id: 'burn', Icon: Moon, name: '暗くする', key: 'U' },
  { id: 'noise', Icon: Dices, name: 'ノイズブラシ', key: 'N' },
];
type ModalName = 'library' | 'effects' | 'presets' | 'new' | 'export' | 'help' | 'forge' | 'parts' | 'weapon' | 'mcpack' | 'convert' | null;
const checker = 'repeating-conic-gradient(#303632 0 25%, #252a27 0 50%) 0 0 / 16px 16px';

export default function App() {
  const { doc, update, undo, redo, canUndo, canRedo } = useDocHistory();
  const [selected, setSelected] = useState<string | null>(() => doc.layers[doc.layers.length - 1]?.id || null);
  const [tool, setTool] = useState<Tool>('hand');
  const [color, setColor] = useState('#a5f9e6');
  const [brush, setBrush] = useState(1);
  const [mirror, setMirror] = useState(false);
  const [grid, setGrid] = useState(true);
  const [view, setView] = useState<ViewMode>('after');
  const [displayMode, setDisplayMode] = useState<'2d' | '3d' | 'tile'>('2d');
  const [background, setBackground] = useState('transparent');
  const [zoom, setZoom] = useState(1);
  const [canvasKey, setCanvasKey] = useState(0);
  const [stageSize, setStageSize] = useState({ w: 680, h: 440 });
  const [focusMode, setFocusMode] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);
  const [pending, setPending] = useState<PendingImage | null>(null);
  const [imports, setImports] = useState<ImportedAsset[]>(() => doc.sampleId?.startsWith('import-') ? [{ id: doc.sampleId, name: doc.name, sources: doc.sources }] : []);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [modelMode, setModelMode] = useState<'auto' | 'block' | 'item'>('auto');
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragDepth = useRef(0);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const saveWarningShown = useRef(false);
  const importRequest = useRef(0);

  const notify = useCallback((message: string, error = false) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, error });
    timer.current = setTimeout(() => setToast(null), error ? 6000 : 3200);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const deferred = useDeferredValue(doc);
  const hasAnimatedEffects = deferred.layers.some(isLayerAnimated);
  const { frameCount, fps } = doc.animation;
  const frames = useMemo(() => {
    const { sources, layers } = deferred;
    const firstAnimated = layers.findIndex(isLayerAnimated);
    if (firstAnimated < 0) return sources.map((source) => applyStack(source, layers, 0));
    // Reuse the static prefix across frames, particularly palette and HD effects.
    const prefix = sources.map((source) => applyStack(source, layers, 0, firstAnimated));
    const tail = layers.slice(firstAnimated);
    const count = Math.max(sources.length, deferred.animation.frameCount);
    return Array.from({ length: count }, (_, i) => applyStack(prefix[Math.floor(i / count * prefix.length)], tail, i / count));
  }, [deferred.sources, deferred.layers, deferred.animation.frameCount]);
  const urls = useMemo(() => frames.map((f) => texToDataURL(f)), [frames]);
  const frameIndex = frame % frames.length;
  const output = frames[frameIndex];
  const sourceIndex = Math.min(doc.sources.length - 1, Math.floor(frameIndex / frames.length * doc.sources.length));
  const base = doc.sources[sourceIndex];
  const processing = deferred !== doc;
  const item = useMemo(() => modelMode === 'item' || (modelMode === 'auto' && (base.w !== base.h || base.d.some((v, i) => i % 4 === 3 && v < 128))), [base, modelMode]);
  const resolution = Math.max(doc.sources[0].w, doc.sources[0].h);
  const baseThumb = useMemo(() => texToDataURL(base), [base]);

  useEffect(() => {
    if (!playing || frames.length < 2 || modal || pending) return;
    const id = setInterval(() => { if (!document.hidden) setFrame((n) => (n + 1) % frames.length); }, 1000 / fps);
    return () => clearInterval(id);
  }, [playing, frames.length, fps, modal, pending]);

  useEffect(() => {
    setSaveState('saving');
    const id = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, serializeProject(doc)); setSaveState('saved'); saveWarningShown.current = false; }
      catch {
        setSaveState('error');
        if (!saveWarningShown.current) notify('自動保存の容量が不足しています。プロジェクトファイルに保存してください。', true);
        saveWarningShown.current = true;
      }
    }, 700);
    return () => clearTimeout(id);
  }, [doc, notify]);

  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver(([entry]) => setStageSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const fitWidth = Math.max(96, Math.min(384, stageSize.w - 116, (stageSize.h - 82) / (output.h / output.w)));
  const canvasWidth = Math.max(output.w, Math.floor(fitWidth * zoom / output.w) * output.w);
  const resetView = useCallback(() => { setZoom(1); setCanvasKey((n) => n + 1); }, []);

  const saveProject = useCallback(() => {
    downloadBlob(new Blob([serializeProject(doc)], { type: 'application/json' }), `${doc.name || 'texture'}.texcraft.json`);
    notify('編集できるプロジェクトファイルを保存しました');
  }, [doc, notify]);

  const openFile = useCallback(async (file: File) => {
    if (file.size > 30 * 1024 * 1024) { notify('30MB以内のファイルを選択してください。', true); return; }
    setLoading(true);
    const request = ++importRequest.current;
    try {
      if (/\.json$/i.test(file.name)) {
        const next = parseProject(await file.text());
        if (request !== importRequest.current) return;
        update(() => next); setSelected(next.layers[next.layers.length - 1]?.id || null); setFrame(0); resetView(); setModal(null);
        setPending(null);
        notify('プロジェクトを読み込みました');
      } else {
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name)) throw new Error('PNG・JPEG・WebP画像、またはTexCraftのJSONを選んでください。');
        const image = await loadImageFile(file);
        if (request !== importRequest.current) return;
        setModal(null); setPending({ image, name: file.name || 'texture.png' });
      }
    } catch (error) { notify(error instanceof Error ? error.message : 'ファイルを読み込めませんでした。', true); }
    finally { if (request === importRequest.current) setLoading(false); }
  }, [update, notify, resetView]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, [contenteditable="true"]') || modal || pending) return;
      const file = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith('image/'))?.getAsFile();
      if (file) { e.preventDefault(); void openFile(file); }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [openFile, modal, pending]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modal || pending) return;
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
      const key = e.key.toLowerCase();
      if (e.ctrlKey || e.metaKey) {
        if (key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
        else if (key === 'y') { e.preventDefault(); redo(); }
        else if (key === 's') { e.preventDefault(); saveProject(); }
        else if (key === 'o') { e.preventDefault(); fileRef.current?.click(); }
      } else {
        const t = TOOLS.find((t) => t.key.toLowerCase() === key);
        if (t) { setTool(t.id); setDisplayMode('2d'); }
        if (key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); setPlaying((p) => !p); }
        if (key === 'escape') { setFocusMode(false); setLeftOpen(false); setRightOpen(false); if (menuRef.current) menuRef.current.open = false; }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modal, pending, undo, redo, saveProject]);

  const chooseSample = (sample: Sample) => {
    const texture = fitTex(sample.make(), resolution);
    update((d) => ({ ...d, sources: [texture], name: sample.id, sampleId: sample.id, workshop: defaultWorkshopState() }));
    setFrame(0); resetView(); setLeftOpen(false);
    if (modal === 'library') setModal(null);
  };
  const importTexture = (sources: Tex[], name: string, keep: boolean) => {
    const id = `import-${Date.now()}`;
    const asset = { id, name, sources };
    setImports((all) => [...all, asset]);
    update((d) => ({ ...d, sources, name, sampleId: id, layers: keep ? d.layers : [], workshop: defaultWorkshopState(), animation: { ...d.animation, frameCount: [4, 8, 12, 16, 24, 32, 64].find((n) => n >= Math.max(sources.length, d.animation.frameCount)) || 64 } }));
    if (!keep) setSelected(null);
    setPending(null); setFrame(0); resetView(); setLeftOpen(false);
    notify(`${sources[0].w} × ${sources[0].h}px${sources.length > 1 ? ` / ${sources.length}フレーム` : ''} を読み込みました`);
  };
  const useImport = (asset: ImportedAsset) => {
    update((d) => ({ ...d, sources: asset.sources, name: asset.name, sampleId: asset.id, workshop: defaultWorkshopState() }));
    setFrame(0); resetView(); setLeftOpen(false); if (modal === 'library') setModal(null);
  };
  const createDocument = (tex: Tex, name: string) => {
    update((d) => ({ ...d, sources: [tex], name, layers: [], sampleId: null, workshop: defaultWorkshopState() }));
    setSelected(null); setModal(null); setTool('pencil'); setFrame(0); setDisplayMode('2d'); resetView();
    notify(`${tex.w} × ${tex.h}px のキャンバスを作成しました`);
  };

  const addLayer = (type: string) => {
    if (doc.layers.length >= 64) { notify('最大64レイヤーです。不要な効果を削除するか、焼き込んでください。', true); return; }
    const layer = newLayer(type, smartParams(type, base));
    update((d) => ({ ...d, layers: [...d.layers, layer] })); setSelected(layer.id);
    if (modal === 'effects') notify('エフェクトを追加しました。右のプロパティで調整できます。');
  };
  const changeLayer = (id: string, patch: Partial<Layer>, key?: string) => update((d) => ({ ...d, layers: d.layers.map((l) => l.id === id ? { ...l, ...patch } : l) }), key);
  const moveLayer = (from: number, to: number) => update((d) => {
    if (from < 0 || to < 0 || from >= d.layers.length || to >= d.layers.length) return d;
    const layers = [...d.layers]; const [layer] = layers.splice(from, 1); layers.splice(to, 0, layer);
    return { ...d, layers };
  });
  const removeLayer = (id: string) => {
    const next = doc.layers.filter((l) => l.id !== id);
    update((d) => ({ ...d, layers: next }));
    if (selected === id) setSelected(next[next.length - 1]?.id || null);
  };
  const duplicateLayer = (id: string) => {
    if (doc.layers.length >= 64) { notify('最大64レイヤーまで追加できます。', true); return; }
    const i = doc.layers.findIndex((l) => l.id === id), src = doc.layers[i];
    if (!src) return;
    const layer = { ...src, id: newLayer(src.type).id, params: { ...src.params } };
    update((d) => { const layers = [...d.layers]; layers.splice(i + 1, 0, layer); return { ...d, layers }; });
    setSelected(layer.id);
  };
  const applyPreset = (preset: Preset, append: boolean) => {
    const layers = presetLayers(preset);
    if (append && layers.length + doc.layers.length > 64) { notify('最大64レイヤーまで追加できます。', true); return; }
    update((d) => ({ ...d, layers: append ? [...d.layers, ...layers] : layers }));
    setSelected(layers[layers.length - 1]?.id || null); setModal(null);
    notify(`「${preset.name}」を${append ? '追加' : '適用'}しました`);
  };
  const bake = () => {
    update((d) => ({ ...d, sources: frames, layers: [], sampleId: null }));
    setSelected(null); resetView(); notify('すべてのフレームにエフェクトを焼き込みました');
  };
  const onStroke = (texture: Tex, key: string) => {
    setPlaying(false);
    update((d) => ({ ...d, sources: d.sources.map((source, i) => i === sourceIndex ? texture : source) }), key);
  };
  const changeAnimation = (patch: Partial<EditorDoc['animation']>) => update((d) => ({ ...d, animation: { ...d.animation, ...patch } }));
  const changeWorkshop = useCallback((workshop: WorkshopState) => update((d) => ({ ...d, workshop }), 'weapon-workshop'), [update]);

  const swatches = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < base.d.length; i += 4) if (base.d[i + 3] > 0) {
      const c = rgbToHex(base.d[i], base.d[i + 1], base.d[i + 2]); map.set(c, (map.get(c) || 0) + 1);
    }
    return [...map].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([c]) => c);
  }, [base]);
  const activeTool = TOOLS.find((t) => t.id === tool)!;
  const activeLayerId = doc.layers.some((l) => l.id === selected) ? selected : doc.layers[doc.layers.length - 1]?.id || null;
  const previewAspect = item ? output.h / output.w : 1;
  const libraryProps = { selectedId: doc.sampleId, onSelect: chooseSample, onImport: () => fileRef.current?.click(), onNew: () => setModal('new'), imports, onUseImport: useImport };
  const closeMenu = () => { if (menuRef.current) menuRef.current.open = false; };
  const toggleInspector = () => { setFocusMode(false); setRightOpen(!rightOpen); setLeftOpen(false); };

  return <div className={`app-shell ${focusMode ? 'focus-mode' : ''}`}
    onDragEnter={(e) => { if (Array.from(e.dataTransfer.types).includes('Files')) { e.preventDefault(); dragDepth.current++; setDragging(true); } }}
    onDragOver={(e) => { if (Array.from(e.dataTransfer.types).includes('Files')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } }}
    onDragLeave={(e) => { if (Array.from(e.dataTransfer.types).includes('Files')) { dragDepth.current--; if (dragDepth.current <= 0) setDragging(false); } }}
    onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); dragDepth.current = 0; setDragging(false); void openFile(e.dataTransfer.files[0]); } }}>
    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void openFile(f); }} />

    <header className="app-header">
      <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setModal(null); setFocusMode(false); }} aria-label="TexCraft エディター"><BrandMark /><h1 className="brand-wordmark">TexCraft<span>テクスチャ工房</span></h1></a>
      <nav className="main-nav" aria-label="メインナビゲーション"><button className={!modal || !['library', 'presets'].includes(modal) ? 'active' : ''} onClick={() => { setModal(null); setFocusMode(false); }}>エディター</button><button className={modal === 'library' ? 'active' : ''} onClick={() => setModal('library')}>テクスチャライブラリ</button><button className={modal === 'presets' ? 'active' : ''} onClick={() => setModal('presets')}>プリセット<Sparkles size={12} /></button><button className={`forge-nav ${modal === 'forge' ? 'active' : ''}`} onClick={() => setModal('forge')} disabled={processing}>進化ラボ<span className="nav-new">NEW</span></button><button className={modal === 'parts' ? 'active' : ''} onClick={() => setModal('parts')}>パーツ</button><button className={modal === 'weapon' ? 'active' : ''} onClick={() => setModal('weapon')}>武器進化</button><button className={modal === 'mcpack' ? 'active' : ''} onClick={() => setModal('mcpack')}>McPack</button><button className={modal === 'convert' ? 'active' : ''} onClick={() => setModal('convert')}>ドット絵化</button></nav>
      <div className="header-actions"><span className={`save-status ${saveState === 'error' ? 'save-error' : ''}`}>{saveState === 'saving' ? <LoaderCircle size={13} className="spin" /> : saveState === 'error' ? <CircleAlert size={13} /> : <Check size={13} />}<span>{saveState === 'saving' ? '保存中...' : saveState === 'error' ? '自動保存できません' : '自動保存済み'}</span></span><button className="icon-button help-button" onClick={() => setModal('help')} aria-label="使い方とヘルプ" title="使い方とヘルプ"><CircleHelp size={18} /></button><button className="primary-button export-button" onClick={() => setModal('export')} disabled={processing}><Download size={15} /><span>エクスポート</span><ChevronDown size={13} /></button></div>
    </header>

    <div className="project-bar">
      <button className="icon-button mobile-library-button" onClick={() => { setFocusMode(false); setLeftOpen(!leftOpen); setRightOpen(false); }} aria-label="テクスチャパネルを開く"><PanelLeft size={17} /></button>
      <div className="project-path"><FolderOpen size={15} /><span>マイプロジェクト</span><ChevronRight size={12} /><Box size={14} className="file-icon" /><div className="project-filename"><input aria-label="テクスチャ名" value={doc.name} maxLength={100} size={Math.max(6, Math.min(24, doc.name.length))} onChange={(e) => update((d) => ({ ...d, name: e.target.value }), 'document-name')} /><span>.png</span></div><span className="file-dot" title="編集中のテクスチャ" /></div>
      <div className="resolution-control"><span>解像度</span><select aria-label="テクスチャ解像度" value={resolution} onChange={(e) => { const size = Number(e.target.value); update((d) => ({ ...d, sources: d.sources.map((s) => fitTex(s, size)) })); resetView(); notify(`長辺を${size}pxに変更しました`); }}>{!RESOLUTIONS.some((n) => n === resolution) && <option value={resolution}>{resolution}px</option>}{RESOLUTIONS.map((n) => <option key={n} value={n}>{Math.max(1, Math.round(n * doc.sources[0].w / resolution))} × {Math.max(1, Math.round(n * doc.sources[0].h / resolution))} px</option>)}</select></div>
      <div className="project-actions"><div className="history-actions"><button className="icon-button" disabled={!canUndo} onClick={undo} aria-label="元に戻す" title="元に戻す (Ctrl+Z)"><Undo2 size={16} /></button><button className="icon-button" disabled={!canRedo} onClick={redo} aria-label="やり直す" title="やり直す (Ctrl+Shift+Z)"><Redo2 size={16} /></button></div><button className="secondary-button upload-button" onClick={() => fileRef.current?.click()} disabled={loading}>{loading ? <LoaderCircle size={14} className="spin" /> : <Upload size={14} />}<span>画像を読み込む</span></button>
        <details className="project-menu" ref={menuRef} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) closeMenu(); }}><summary aria-label="プロジェクトメニュー" className="icon-button" title="プロジェクトメニュー"><MoreHorizontal size={19} /></summary><div className="menu-content"><button onClick={() => { closeMenu(); setModal('new'); }}><Plus size={15} /> 新規テクスチャ</button><button onClick={() => { closeMenu(); setModal('presets'); }}><Sparkles size={15} /> プリセットから選ぶ</button><button onClick={() => { closeMenu(); setModal('forge'); }}><Sparkles size={15} /> 進化ラボ（派生モデル生成）</button><button onClick={() => { closeMenu(); setModal('library'); }}><Grid2X2 size={15} /> テクスチャ一覧</button><button onClick={() => { closeMenu(); saveProject(); }}><FileDown size={15} /> プロジェクトを保存</button><button disabled={!doc.layers.length || processing} onClick={() => { closeMenu(); bake(); }}><Layers size={15} /> エフェクトを焼き込む</button><button className="danger" disabled={!doc.layers.length} onClick={() => { closeMenu(); update((d) => ({ ...d, layers: [] })); setSelected(null); }}><Trash2 size={15} /> エフェクトをすべて削除</button></div></details>
      </div>
    </div>

    <div className="workspace">
      {(leftOpen || rightOpen) && <button className="panel-scrim" aria-label="パネルを閉じる" onClick={() => { setLeftOpen(false); setRightOpen(false); }} />}
      <aside className={`library-pane ${leftOpen ? 'mobile-open' : ''}`}><TextureLibrary {...libraryProps} /></aside>

      <main className="editor-main" aria-label="テクスチャエディター">
        <div className="canvas-toolbar"><div className="canvas-mode-tabs">{([['2d', '2D エディター', ScanLine], ['3d', '3D プレビュー', Box], ['tile', 'タイル', Grid2X2]] as const).map(([id, label, Icon]) => <button className={displayMode === id ? 'selected' : ''} key={id} onClick={() => setDisplayMode(id)}><Icon size={14} /><span>{label}</span></button>)}</div><div className="canvas-toolbar-actions"><button className={`compare-button ${view === 'split' ? 'selected' : ''}`} title="元画像と比較" onClick={() => { setDisplayMode('2d'); setView(view === 'split' ? 'after' : 'split'); }}><Columns2 size={15} /><span>比較</span></button><button className={`icon-button ${view === 'before' ? 'active' : ''}`} title="元画像を表示" aria-label="元画像を表示" aria-pressed={view === 'before'} onClick={() => { setDisplayMode('2d'); setView(view === 'before' ? 'after' : 'before'); }}><Eye size={15} /></button><span className="toolbar-separator" /><button className={`icon-button ${grid ? 'active' : ''}`} title="グリッドを切り替え" aria-label="グリッドを切り替え" aria-pressed={grid} onClick={() => setGrid(!grid)}><Grid3X3 size={15} /></button><button className={`icon-button ${focusMode ? 'active' : ''}`} title="集中モード" aria-label="集中モード" aria-pressed={focusMode} onClick={() => setFocusMode(!focusMode)}><Maximize2 size={15} /></button><button className="icon-button mobile-inspector-button" onClick={toggleInspector} aria-label="エフェクト設定を開く"><SlidersHorizontal size={16} /></button></div></div>

        <div className="canvas-workspace"><div className="tool-rail" role="toolbar" aria-label="描画ツール"><div className="drawing-tools">{TOOLS.map(({ id, Icon, name, key }) => <button className={`tool-button ${tool === id ? 'selected' : ''}`} key={id} title={`${name} (${key})`} aria-label={name} aria-pressed={tool === id} onClick={() => { setTool(id); setDisplayMode('2d'); }}><Icon size={18} strokeWidth={1.65} /></button>)}</div><div className="tool-bottom"><div className="tool-separator" /><button className={`tool-button ${mirror ? 'selected' : ''}`} onClick={() => setMirror(!mirror)} aria-label="左右対称描画" aria-pressed={mirror} title="左右対称描画"><FlipHorizontal size={18} strokeWidth={1.65} /></button><details className="color-menu"><summary className="tool-color" aria-label="描画色を選択" title="描画色"><span style={{ background: color }} /><i /></summary><div className="color-popover"><label className="inline-control"><span>描画色</span><input type="color" value={color} onChange={(e) => { setColor(e.target.value); setTool('pencil'); }} /></label><code>{color.toUpperCase()}</code><span className="small-label">テクスチャのパレット</span><div className="swatch-grid">{swatches.map((c) => <button key={c} style={{ background: c }} title={c} aria-label={`描画色 ${c}`} onClick={() => { setColor(c); setTool('pencil'); }} />)}</div></div></details></div></div>
          <div className={`canvas-stage ${displayMode !== '2d' ? 'preview-mode' : ''}`} ref={stageRef}>
            <div className="canvas-topline"><span>{displayMode === '2d' ? <><span className="small-dot" />{output.w} × {output.h} <span className="muted-label">RGBA</span></> : <><Box size={12} />{displayMode === '3d' ? 'マテリアルプレビュー' : 'シームレスプレビュー'}</>}</span><span className="live-preview">{processing ? <LoaderCircle size={11} className="spin" /> : <span className="live-dot" />}{processing ? '処理中' : 'ライブプレビュー'}</span></div>
            {displayMode === '2d' ? <PixelCanvas key={canvasKey} base={base} output={output} view={view} grid={grid} zoom={canvasWidth} tool={tool} color={color} brush={brush} mirror={mirror} bg={background === 'transparent' ? checker : background === 'light' ? '#ecefe9' : '#171a18'} onStroke={onStroke} onPick={(c) => { setColor(c); setTool('pencil'); notify(`${c.toUpperCase()} を取得しました`); }} /> : displayMode === '3d' ? <Block3D url={urls[frameIndex]} item={item} aspect={previewAspect} size={Math.max(100, Math.min(224, stageSize.h * 0.4)) / Math.max(1, previewAspect)} large /> : <TilePreview url={urls[frameIndex]} w={output.w} h={output.h} />}
            {displayMode === '2d' && tool !== 'hand' && tool !== 'picker' && <div className="brush-options"><Pencil size={12} /><label>ブラシ <select aria-label="ブラシサイズ" value={brush} onChange={(e) => setBrush(Number(e.target.value))}>{[1, 2, 3, 4, 6, 8, 12, 16].map((n) => <option key={n} value={n}>{n}px</option>)}</select></label><span className="brush-color-dot" style={{ background: color }} /><code>{color.toUpperCase()}</code>{mirror && <span className="mirror-notice">左右対称</span>}</div>}
          </div>
        </div>

        <div className="canvas-statusbar"><div className="current-tool"><activeTool.Icon size={13} /><span>{activeTool.name}ツール</span><kbd>{activeTool.key}</kbd></div><div className="background-control"><span className="checker-icon" /><select aria-label="キャンバス背景" value={background} onChange={(e) => setBackground(e.target.value)}><option value="transparent">透過背景</option><option value="dark">ダーク背景</option><option value="light">ライト背景</option></select></div><div className="zoom-controls"><button className="icon-button" aria-label="縮小" title="縮小" disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}><Minus size={14} /></button><button className="zoom-value" onClick={resetView} title="画面にフィット">{Math.round(canvasWidth / output.w * 100)}%<ChevronDown size={10} /></button><button className="icon-button" aria-label="拡大" title="拡大" disabled={zoom >= 4} onClick={() => setZoom((z) => Math.min(4, z + 0.25))}><Plus size={14} /></button><span className="toolbar-separator" /><button className="icon-button" title="ズームと位置をリセット" aria-label="ズームと位置をリセット" onClick={resetView}><RotateCcw size={13} /></button></div></div>

        {frames.length > 1 && <div className="animation-bar"><button className={`icon-button ${playing ? 'active' : ''}`} aria-label={playing ? 'アニメーションを一時停止' : 'アニメーションを再生'} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={15} /> : <Play size={15} />}</button><Film size={13} /><input type="range" aria-label="アニメーションのフレーム" min={0} max={frames.length - 1} value={frameIndex} onChange={(e) => { setPlaying(false); setFrame(Number(e.target.value)); }} /><span className="frame-counter">{String(frameIndex + 1).padStart(2, '0')} / {frames.length}</span>{hasAnimatedEffects && <select aria-label="アニメーションフレーム数" value={frameCount} onChange={(e) => changeAnimation({ frameCount: Number(e.target.value) })}>{[4, 8, 12, 16, 24, 32, 64].map((n) => <option key={n} value={n} disabled={n < doc.sources.length}>{n} frames</option>)}</select>}<select aria-label="アニメーション速度" value={fps} onChange={(e) => changeAnimation({ fps: Number(e.target.value) })}>{[2, 4, 5, 10, 20].map((n) => <option key={n} value={n}>{n} fps</option>)}</select></div>}
        <EffectLibrary base={deferred.sources[0]} onAdd={addLayer} onExpand={() => setModal('effects')} />
      </main>

      <aside className={`inspector-pane ${rightOpen ? 'mobile-open' : ''}`}>
        <div className="panel-title"><h2><Layers size={15} /> エフェクト <span className="count-badge">{doc.layers.length}</span></h2><div><button className="icon-button random-button" title="ランダムなエフェクトセット" aria-label="ランダムなエフェクトセット" onClick={() => { const layers = randomLayers(); update((d) => ({ ...d, layers })); setSelected(layers[layers.length - 1].id); notify('ランダムなエフェクトセットを適用しました'); }}><Dices size={15} /></button><button className="icon-button" onClick={() => setModal('effects')} title="エフェクトを追加" aria-label="エフェクトを追加"><Plus size={17} /></button></div></div>
        <div className="inspector-scroll"><div className="stack-caption"><span>上のレイヤーほど後に適用</span><span>非破壊編集</span></div><LayerPanel layers={doc.layers} selected={activeLayerId} onSelect={setSelected} onChange={changeLayer} onMove={moveLayer} onRemove={removeLayer} onDuplicate={duplicateLayer} /><div className="source-layer"><span className="source-layer-image checker"><img src={baseThumb} alt="元画像" /></span><span>元のテクスチャ<small>{base.w} × {base.h} px</small></span><ShieldCheck size={14} /></div></div>
        <section className="inspector-preview"><div className="section-heading"><h3>3D プレビュー</h3><button className="icon-button" title="大きくプレビュー" aria-label="大きくプレビュー" onClick={() => { setDisplayMode('3d'); setRightOpen(false); }}><ArrowUpRight size={15} /></button></div><Block3D url={urls[frameIndex]} item={item} aspect={previewAspect} size={94 / Math.max(1, previewAspect)} /><div className="preview-footer"><span><span className="live-dot" /> 変更をリアルタイムで反映</span><select aria-label="3Dモデルの種類" value={modelMode} onChange={(e) => setModelMode(e.target.value as typeof modelMode)}><option value="auto">自動</option><option value="block">ブロック</option><option value="item">アイテム</option></select></div></section>
      </aside>
    </div>

    <footer className="app-footer"><span><span className="footer-brand">TexCraft Studio</span><span className="footer-version">v2.0</span></span><span className="footer-hint"><Sparkles size={12} /> ひとつのピクセルから、世界を変えよう。</span><span><span className="live-dot" /> 16–128px 対応 <span className="footer-divider" /> ローカルワークスペース</span></footer>

    {modal === 'library' && <Modal title="テクスチャライブラリ" subtitle="ブロックも、アイテムも、あなたらしく。" wide onClose={() => setModal(null)}><TextureLibrary {...libraryProps} full /></Modal>}
    {modal === 'effects' && <Modal title="エフェクトライブラリ" subtitle="質感、色彩、光。自由に重ねて、理想のテクスチャに。" wide onClose={() => setModal(null)}><EffectLibrary base={doc.sources[0]} onAdd={addLayer} full /></Modal>}
    {modal === 'presets' && <Modal title="スタイルプリセット" subtitle="ひとつ選ぶだけで、テクスチャの新しい可能性が広がります。" wide onClose={() => setModal(null)}><PresetLibrary base={doc.sources[0]} onApply={applyPreset} /></Modal>}
    {modal === 'new' && <NewDialog onClose={() => setModal(null)} onCreate={createDocument} />}
    {modal === 'export' && <ExportDialog doc={doc} frames={frames} frameIndex={frameIndex} fps={fps} onClose={() => setModal(null)} onNotify={notify} />}
    {modal === 'help' && <HelpDialog onClose={() => setModal(null)} />}
    {modal === 'parts' && <Modal title="パーツスタンプ" subtitle="刃・鍔・宝石・翼などを重ねて装飾。" wide onClose={() => setModal(null)}><PartsPanel base={doc.sources[0]} onAdd={(layer, label) => { update((d) => ({ ...d, layers: [...d.layers, layer] })); setSelected(layer.id); notify(`パーツ「${label}」を追加しました`); }} /></Modal>}
    {modal === 'weapon' && <Modal title="武器進化" subtitle="段階・属性・モーションで武器を進化。" wide onClose={() => setModal(null)}><WeaponPanel base={doc.sources[0]} name={doc.name} onApply={(layers, label) => { update((d) => ({ ...d, layers })); setSelected(null); setModal(null); notify(`「${label}」を適用しました`); }} /></Modal>}
    {modal === 'mcpack' && <Modal title="McPack出力" subtitle="Java版リソースパックとして書き出し。" onClose={() => setModal(null)}><McPackDialog base={doc.sources[0]} layers={doc.layers} name={doc.name} onNotify={notify} /></Modal>}
    {modal === 'convert' && <Modal title="ドット絵化" subtitle="減色してドット絵に変換。" onClose={() => setModal(null)}><ConvertDialog base={doc.sources[0]} onApply={(tex, label) => { update((d) => ({ ...d, sources: [tex], layers: [], sampleId: null, name: `${d.name}-dot` })); setSelected(null); setFrame(0); resetView(); setModal(null); notify(label); }} /></Modal>}
    {modal === 'forge' && <ForgeLab base={doc.sources[0]} processed={frames[0]} name={doc.name} fps={fps} workshop={doc.workshop} onWorkshopChange={changeWorkshop} onClose={() => setModal(null)} onNotify={notify} onOpen={(variantFrames, suffix, label) => {
      update((d) => ({ ...d, sources: variantFrames, layers: [], sampleId: null, workshop: defaultWorkshopState(), name: `${d.name.replace(/_(tier\d|break\d|awaken|dual|great|dagger|serrated|broken|shadow|spirit|crystalform|winged|twin|el_\w+|mat_\w+|overdrive|charged|berserk|guardmode|stealth|frozenmode|overheat|poisoned|blessed|slash|combo|smash|thrust|spin|throw|cast|charge|summon|guardpose|idle)$/, '')}_${suffix}`, animation: { ...d.animation, frameCount: [4, 8, 12, 16, 24, 32, 64].find((n) => n >= variantFrames.length) || 64 } }));
      setSelected(null); setFrame(0); setPlaying(true); resetView(); setModal(null);
      notify(`「${label}」をエディターで開きました${variantFrames.length > 1 ? `（${variantFrames.length}フレーム）` : ''}`);
    }} />}
    {pending && <ImportDialog key={pending.image.src} pending={pending} onClose={() => setPending(null)} onImport={importTexture} />}
    {dragging && <div className="file-drop-overlay"><div><Upload size={38} /><h2>テクスチャをここにドロップ</h2><p>PNG / JPEG / WebP / TexCraft プロジェクト</p></div></div>}
    {toast && <div className={`toast ${toast.error ? 'toast-error' : ''}`} role={toast.error ? 'alert' : 'status'}>{toast.error ? <CircleAlert size={17} /> : <Check size={17} />}<span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="通知を閉じる"><X size={14} /></button></div>}
  </div>;
}