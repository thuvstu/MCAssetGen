import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import PixelCanvas, { Tool, ViewMode } from './components/PixelCanvas';
import LayerPanel from './components/LayerPanel';
import { Block3D, TilePreview } from './components/Previews';
import { CATEGORIES, CategoryId, EFFECTS, EFFECT_MAP, Layer, applyStack, isLayerAnimated, newLayer, randomLayers } from './lib/effects';
import WeaponPanel from './components/WeaponPanel';
import PartsPanel from './components/PartsPanel';
import { PRESETS, presetLayers } from './lib/presets';
import { SAMPLES } from './lib/samples';
import { Tex, ImportMode, createTex, download, loadFileToTex, lum, resizeTex, rgbToHex, stackVertical, texToDataURL } from './lib/tex';

interface Doc { base: Tex; layers: Layer[]; name: string }
const STORAGE = 'mc-texforge-v1';

function encodeTex(t: Tex) {
  let s = '';
  for (let i = 0; i < t.d.length; i += 8192) s += String.fromCharCode(...t.d.subarray(i, i + 8192));
  return { w: t.w, h: t.h, data: btoa(s) };
}
function decodeTex(o: { w: number; h: number; data: string }): Tex {
  const s = atob(o.data);
  const d = new Uint8ClampedArray(s.length);
  for (let i = 0; i < s.length; i++) d[i] = s.charCodeAt(i);
  return { w: o.w, h: o.h, d };
}
function loadInitial(): Doc {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) {
      const o = JSON.parse(raw);
      return { base: decodeTex(o.base), layers: (o.layers as Layer[]).filter((l) => EFFECT_MAP[l.type]), name: o.name || 'texture' };
    }
  } catch { /* ignore */ }
  return { base: SAMPLES.find((s) => s.id === 'sword')!.make(), layers: presetLayers(PRESETS[0]), name: 'diamond_sword' };
}

function useHistory(initial: () => Doc) {
  const [s, setS] = useState(() => ({ past: [] as Doc[], present: initial(), future: [] as Doc[] }));
  const last = useRef<{ key: string | null; t: number }>({ key: null, t: 0 });
  const update = useCallback((fn: (d: Doc) => Doc, key?: string) => {
    const now = Date.now();
    const co = !!key && key === last.current.key && now - last.current.t < 1500;
    last.current = { key: key ?? null, t: now };
    setS((st) => {
      const next = fn(st.present);
      if (next === st.present) return st;
      return co ? { ...st, present: next, future: [] } : { past: [...st.past.slice(-80), st.present], present: next, future: [] };
    });
  }, []);
  const undo = useCallback(() => setS((st) => (st.past.length ? { past: st.past.slice(0, -1), present: st.past[st.past.length - 1], future: [st.present, ...st.future] } : st)), []);
  const redo = useCallback(() => setS((st) => (st.future.length ? { past: [...st.past, st.present], present: st.future[0], future: st.future.slice(1) } : st)), []);
  return { doc: s.present, update, undo, redo, canUndo: s.past.length > 0, canRedo: s.future.length > 0 };
}

const BGS: [string, string][] = [
  ['checker', '透過'],
  ['#1b1b20', 'ダーク'],
  ['#e8e8e8', 'ライト'],
  ['linear-gradient(#7ab8ff,#c8e4ff)', '空'],
  ['#3b6b25', '草原'],
  ['#2a0808', 'ネザー'],
];
const bgCss = (b: string) => (b === 'checker' ? 'repeating-conic-gradient(#3a3a42 0 25%, #2b2b31 0 50%) 0 0/24px 24px' : b);

const TOOLS: { id: Tool; icon: string; name: string }[] = [
  { id: 'pencil', icon: '✏️', name: 'ペン' },
  { id: 'eraser', icon: '🧽', name: '消しゴム' },
  { id: 'fill', icon: '🪣', name: '塗りつぶし' },
  { id: 'picker', icon: '💉', name: 'スポイト' },
  { id: 'dodge', icon: '☀️', name: '覆い焼き(明るく)' },
  { id: 'burn', icon: '🌙', name: '焼き込み(暗く)' },
  { id: 'noise', icon: '🌫️', name: 'ノイズブラシ' },
];

export default function App() {
  const { doc, update, undo, redo, canUndo, canRedo } = useHistory(loadInitial);
  const [selected, setSelected] = useState<string | null>(null);
  const [cat, setCat] = useState<CategoryId | 'preset' | 'weapon'>('preset');
  const [search, setSearch] = useState('');
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#5fbf3f');
  const [brush, setBrush] = useState(1);
  const [mirror, setMirror] = useState(false);
  const [grid, setGrid] = useState(false);
  const [view, setView] = useState<ViewMode>('after');
  const [zoom, setZoom] = useState(512);
  const [bg, setBg] = useState('checker');
  const [frameCount, setFrameCount] = useState(16);
  const [fps, setFps] = useState(10);
  const [playing, setPlaying] = useState(true);
  const [frame, setFrame] = useState(0);
  const [preview, setPreview] = useState<'3d' | 'tile' | 'frames'>('3d');
  const [previewShape, setPreviewShape] = useState<'auto' | 'block' | 'item'>('auto');
  const [exportScale, setExportScale] = useState(1);
  const [importMode, setImportMode] = useState<ImportMode>('full');
  const [targetW, setTargetW] = useState(doc.base.w);
  const [targetH, setTargetH] = useState(doc.base.h);
  const [toast, setToast] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  // Process only the visible frame; render the full animation when exporting or browsing frames.
  const deferred = useDeferredValue(doc);
  const animated = deferred.layers.some(isLayerAnimated);
  const totalFrames = animated ? frameCount : 1;
  const fi = frame % totalFrames;
  const output = useMemo(() => applyStack(deferred.base, deferred.layers, fi / totalFrames), [deferred, fi, totalFrames]);
  const outputUrl = useMemo(() => texToDataURL(output), [output]);
  const frameUrls = useMemo(() => preview === 'frames'
    ? Array.from({ length: totalFrames }, (_, i) => i === fi ? outputUrl : texToDataURL(applyStack(deferred.base, deferred.layers, i / totalFrames)))
    : [], [preview, deferred, totalFrames, fi, outputUrl]);

  useEffect(() => {
    if (!playing || totalFrames < 2) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % totalFrames), 1000 / fps);
    return () => clearInterval(id);
  }, [playing, totalFrames, fps]);

  useEffect(() => { setTargetW(doc.base.w); setTargetH(doc.base.h); }, [doc.base.w, doc.base.h]);

  // ---- autosave
  useEffect(() => {
    const id = setTimeout(() => {
      try { localStorage.setItem(STORAGE, JSON.stringify({ base: encodeTex(doc.base), layers: doc.layers, name: doc.name })); } catch { /* quota */ }
    }, 600);
    return () => clearTimeout(id);
  }, [doc]);

  // ---- keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type === 'text') return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); }
      else if (!e.ctrlKey && !e.metaKey) {
        const map: Record<string, Tool> = { b: 'pencil', e: 'eraser', g: 'fill', i: 'picker', o: 'dodge', u: 'burn' };
        if (map[k]) setTool(map[k]);
        if (k === ' ') { e.preventDefault(); setPlaying((p) => !p); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // ---- import
  const importFile = useCallback(async (f: Blob, name = 'texture') => {
    try {
      const t = await loadFileToTex(f, 128, importMode);
      update((d) => ({ ...d, base: t, name: name.replace(/\.[^.]+$/, '') }));
      say(`読み込みました (${t.w}×${t.h})${importMode === 'first-frame' ? ' / 先頭フレーム' : ''}`);
      if (t.w !== t.h) setPreview('tile');
    } catch { say('画像を読み込めませんでした'); }
  }, [update, importMode]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith('image/'));
      const f = item?.getAsFile();
      if (f) importFile(f, 'pasted');
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [importFile]);

  // ---- layer ops
  const addLayer = (type: string) => {
    const l = newLayer(type);
    update((d) => ({ ...d, layers: [...d.layers, l] }));
    setSelected(l.id);
  };
  const changeLayer = (id: string, patch: Partial<Layer>, key?: string) =>
    update((d) => ({ ...d, layers: d.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) }), key);
  const moveLayer = (from: number, to: number) =>
    update((d) => {
      if (to < 0 || to >= d.layers.length) return d;
      const ls = [...d.layers];
      const [m] = ls.splice(from, 1);
      ls.splice(to, 0, m);
      return { ...d, layers: ls };
    });
  const removeLayer = (id: string) => update((d) => ({ ...d, layers: d.layers.filter((l) => l.id !== id) }));
  const duplicateLayer = (id: string) =>
    update((d) => {
      const i = d.layers.findIndex((l) => l.id === id);
      const src = d.layers[i];
      const c = { ...newLayer(src.type, src.params, src.seed), enabled: src.enabled, opacity: src.opacity };
      const ls = [...d.layers];
      ls.splice(i + 1, 0, c);
      return { ...d, layers: ls };
    });

  const bake = () => {
    const t = applyStack(doc.base, doc.layers, fi / totalFrames);
    update((d) => ({ ...d, base: t, layers: [] }));
    say('エフェクトを画像に焼き込みました');
  };

  // ---- export
  const exportPng = () => { download(texToDataURL(output, exportScale), `${doc.name}${exportScale > 1 ? `_x${exportScale}` : ''}.png`); };
  const exportStrip = () => {
    const strip = stackVertical(Array.from({ length: totalFrames }, (_, i) => applyStack(doc.base, doc.layers, i / totalFrames)));
    download(texToDataURL(strip, exportScale), `${doc.name}.png`);
    const meta = { animation: { frametime: Math.max(1, Math.round(20 / fps)), interpolate: false } };
    const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    setTimeout(() => { download(u, `${doc.name}.png.mcmeta`); URL.revokeObjectURL(u); }, 300);
    say('アニメーション (.png + .mcmeta) を書き出しました');
  };
  const exportSheet = () => {
    // side-by-side before/after comparison
    const c = document.createElement('canvas');
    const s = Math.max(1, Math.floor(256 / Math.max(output.w, output.h)));
    const W = output.w * s, H = output.h * s;
    c.width = W * 2 + 24; c.height = H + 16;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#1b1b20'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.imageSmoothingEnabled = false;
    const a = new Image(), b = new Image();
    let n = 0;
    const done = () => { if (++n < 2) return; ctx.drawImage(a, 8, 8, W, H); ctx.drawImage(b, W + 16, 8, W, H); download(c.toDataURL(), `${doc.name}_compare.png`); };
    a.onload = done; b.onload = done;
    a.src = texToDataURL(doc.base); b.src = outputUrl;
  };

  // ---- swatches
  const swatches = useMemo(() => {
    const m = new Map<string, number>();
    const d = doc.base.d;
    for (let i = 0; i < d.length && m.size < 400; i += 4) if (d[i + 3] > 0) { const h = rgbToHex(d[i], d[i + 1], d[i + 2]); m.set(h, (m.get(h) || 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([h]) => h)
      .sort((a, b) => lum(parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)) - lum(parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)));
  }, [doc.base]);

  const isItem = useMemo(() => { for (let i = 3; i < doc.base.d.length; i += 4) if (doc.base.d[i] < 128) return true; return false; }, [doc.base]);
  const showAsItem = previewShape === 'auto' ? isItem : previewShape === 'item';

  const libItems = EFFECTS.filter((e) => (search ? (e.name + e.desc).includes(search) : cat !== 'preset' && cat !== 'weapon' && e.category === cat));
  const dirtUrl = useMemo(() => texToDataURL(SAMPLES.find((s) => s.id === 'dirt')!.make(), 4), []);

  return (
    <div
      className="min-h-screen bg-[#141417] text-zinc-100 flex flex-col"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
      onDrop={(e) => {
        e.preventDefault(); setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && f.type.startsWith('image/')) importFile(f, f.name);
      }}
    >
      {/* HEADER */}
      <header className="flex flex-wrap items-center gap-2 px-4 py-2 bg-[#1e1e23] border-b-4 border-black">
        <div className="flex items-center gap-2 mr-3">
          <div className="w-9 h-9 grid grid-cols-3 grid-rows-3 border-2 border-black">
            {['#5fbf3f', '#4a9a2f', '#6fd24a', '#866043', '#6b4a32', '#79553a', '#593d29', '#866043', '#4a3222'].map((c, i) => <span key={i} style={{ background: c }} />)}
          </div>
          <div>
            <h1 className="font-pixel text-lg leading-none tracking-wide">テクスチャ工房</h1>
            <p className="text-[10px] text-zinc-500 leading-none mt-0.5">Minecraft Texture Forge</p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f, f.name); e.target.value = ''; }} />
        <button className="btn btn-green" onClick={() => fileRef.current?.click()}>📂 画像を読み込む</button>
        <select className="btn" aria-label="画像の読み込み方法" value={importMode} onChange={(e) => setImportMode(e.target.value as ImportMode)} title="画像は最大128pxに縮小。縦長のスキンやアトラスは画像全体を選択してください">
          <option value="full">画像全体を読み込む</option>
          <option value="first-frame">縦長PNGの先頭1コマ</option>
        </select>
        <select className="btn" value="" onChange={(e) => {
          const s = SAMPLES.find((x) => x.id === e.target.value);
          if (s) { update((d) => ({ ...d, base: s.make(), name: s.id })); say(`サンプル「${s.name}」`); }
        }}>
          <option value="">🧱 サンプル…</option>
          <optgroup label="ブロック">{SAMPLES.filter((s) => s.kind === 'block').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>
          <optgroup label="アイテム">{SAMPLES.filter((s) => s.kind === 'item').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>
        </select>
        <details className="relative group">
          <summary className="btn list-none select-none">↗ 解像度</summary>
          <div className="absolute top-full left-0 mt-1 z-30 w-64 bg-[#26262b] border-2 border-zinc-600 shadow-xl p-3 rounded space-y-2 text-xs">
            <p className="text-zinc-400">元画像をニアレスト補間でリサイズ。縦横は別々に指定できます。</p>
            <div className="flex items-center gap-2">
              <label>幅 <input aria-label="幅" type="number" min={16} max={128} value={targetW} onChange={(e) => setTargetW(+e.target.value)} className="w-16 bg-zinc-900 border border-zinc-600 rounded px-1 py-1" /></label>
              <span>×</span>
              <label>高さ <input aria-label="高さ" type="number" min={16} max={128} value={targetH} onChange={(e) => setTargetH(+e.target.value)} className="w-16 bg-zinc-900 border border-zinc-600 rounded px-1 py-1" /></label>
            </div>
            <div className="flex gap-1 flex-wrap">{[16, 32, 64, 128].map((n) => <button key={n} className="btn-mini" onClick={() => { setTargetW(n); setTargetH(n); }}>{n}px</button>)}</div>
            <button className="btn btn-green w-full" disabled={!Number.isInteger(targetW) || !Number.isInteger(targetH) || targetW < 16 || targetH < 16 || targetW > 128 || targetH > 128} onClick={() => {
              update((d) => ({ ...d, base: resizeTex(d.base, targetW, targetH) }));
              say(`${targetW}×${targetH} にリサイズしました`);
            }}>元画像をリサイズ</button>
          </div>
        </details>
        <select className="btn" value="" onChange={(e) => {
          const n = +e.target.value;
          if (n) { update((d) => ({ ...d, base: createTex(n, n), name: 'new_texture' })); }
        }}>
          <option value="">📄 新規…</option>
          {[16, 32, 64, 128].map((n) => <option key={n} value={n}>{n}×{n} 空白</option>)}
        </select>
        <div className="flex gap-1">
          <button className="btn" disabled={!canUndo} onClick={undo} title="元に戻す (Ctrl+Z)">↶</button>
          <button className="btn" disabled={!canRedo} onClick={redo} title="やり直し (Ctrl+Y)">↷</button>
        </div>
        <button className="btn" onClick={() => { const ls = randomLayers(); update((d) => ({ ...d, layers: ls })); setSelected(null); say('ランダム装飾を生成しました'); }}>🎲 ランダム装飾</button>
        <button className="btn" onClick={bake} disabled={!doc.layers.length} title="現在の結果を元画像に確定">🔥 焼き込み</button>
        <div className="flex-1" />
        <div className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-zinc-700">
          <span className="text-xs text-zinc-400">書き出し</span>
          <select className="bg-zinc-900 text-xs rounded px-1 py-1 border border-zinc-700" value={exportScale} onChange={(e) => setExportScale(+e.target.value)}>
            {[1, 2, 4, 8, 16].map((n) => <option key={n} value={n}>×{n}</option>)}
          </select>
          <button className="btn btn-green !py-1" onClick={exportPng}>💾 PNG</button>
          <button className="btn !py-1" onClick={exportStrip} disabled={totalFrames < 2} title="マイクラ用アニメーションテクスチャ">🎞️ アニメ+mcmeta</button>
          <button className="btn !py-1" onClick={exportSheet} title="ビフォーアフター比較画像">🆚 比較画像</button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* LEFT: LIBRARY */}
        <aside className="lg:w-72 bg-[#1b1b1f] border-r-4 border-black flex flex-col lg:max-h-[calc(100vh-60px)]">
          <div className="p-2 border-b border-zinc-800">
            <input type="text" placeholder="🔍 エフェクト検索…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm" />
            <div className="grid grid-cols-2 gap-1 mt-2">
              <button onClick={() => { setCat('weapon'); setSearch(''); }} className={`tab ${cat === 'weapon' && !search ? 'tab-on' : ''}`}>⚔️ 武器進化</button>
              <button onClick={() => { setCat('preset'); setSearch(''); }} className={`tab ${cat === 'preset' && !search ? 'tab-on' : ''}`}>⭐ プリセット</button>
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => { setCat(c.id); setSearch(''); }} className={`tab ${cat === c.id && !search ? 'tab-on' : ''}`}>
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 scroll-thin">
            {cat === 'weapon' && !search ? (
              <WeaponPanel
                base={doc.base}
                name={doc.name}
                onApply={(layers, label) => {
                  update((d) => ({ ...d, layers }));
                  setSelected(null);
                  say(label);
                }}
              />
            ) : cat === 'parts' && !search ? (
              <PartsPanel
                base={doc.base}
                onAdd={(layer, label) => {
                  update((d) => ({ ...d, layers: [...d.layers, layer] }));
                  setSelected(layer.id);
                  say(label);
                }}
              />
            ) : cat === 'preset' && !search ? (
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map((p) => (
                  <button key={p.id} className="lib-card text-left"
                    onClick={() => { update((d) => ({ ...d, layers: presetLayers(p) })); setSelected(null); say(`プリセット「${p.name}」を適用`); }}
                    onContextMenu={(e) => { e.preventDefault(); update((d) => ({ ...d, layers: [...d.layers, ...presetLayers(p)] })); say(`「${p.name}」を追加`); }}
                    title="クリックで置換 / 右クリックで追加">
                    <div className="text-xl">{p.icon}</div>
                    <div className="text-xs font-bold">{p.name}</div>
                    <div className="text-[10px] text-zinc-500">{p.desc}</div>
                  </button>
                ))}
                <p className="col-span-2 text-[10px] text-zinc-500 mt-1">クリック：置き換え ／ 右クリック：重ねて追加</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {libItems.map((e) => (
                  <button key={e.id} className="lib-card flex items-start gap-2 text-left" onClick={() => addLayer(e.id)}>
                    <span className="text-xl w-7 text-center shrink-0">{e.icon}</span>
                    <span className="min-w-0">
                      <span className="text-sm font-bold block">{e.name} {e.isNew && <span className="text-[9px] bg-lime-700 px-1 border border-black align-middle">NEW</span>} {e.animated && <span className="text-[9px] bg-fuchsia-700 px-1 border border-black align-middle">ANIM</span>}</span>
                      <span className="text-[10px] text-zinc-500 block leading-tight">{e.desc}</span>
                    </span>
                    <span className="ml-auto text-lime-400 text-lg leading-none">＋</span>
                  </button>
                ))}
                {!libItems.length && <p className="text-xs text-zinc-500 p-2">見つかりません</p>}
              </div>
            )}
          </div>
          <div className="p-2 text-[10px] text-zinc-500 border-t border-zinc-800">
            16〜128px対応 ・ {EFFECTS.length} エフェクト ・ {PRESETS.length} プリセット ・ パーツ多数
          </div>
        </aside>

        {/* CENTER */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-[#1e1e23] border-b-2 border-black">
            <div className="flex gap-0.5 bg-black/30 p-0.5 rounded">
              {TOOLS.map((t) => (
                <button key={t.id} title={t.name} onClick={() => setTool(t.id)}
                  className={`w-8 h-8 rounded text-base ${tool === t.id ? 'bg-lime-600 shadow-inner' : 'hover:bg-zinc-700'}`}>{t.icon}</button>
              ))}
            </div>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-8 cursor-pointer bg-transparent" />
            <div className="flex flex-wrap gap-0.5 max-w-[260px]">
              {swatches.map((s) => (
                <button key={s} title={s} onClick={() => setColor(s)} className={`w-4 h-4 border ${color === s ? 'border-white' : 'border-black'}`} style={{ background: s }} />
              ))}
            </div>
            <label className="flex items-center gap-1 text-xs text-zinc-400">
              太さ
              <select value={brush} onChange={(e) => setBrush(+e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-zinc-100">
                {[1, 2, 3, 4, 6, 8].map((n) => <option key={n} value={n}>{n}px</option>)}
              </select>
            </label>
            <button className={`chip ${mirror ? 'chip-on' : ''}`} onClick={() => setMirror(!mirror)}>🪞 左右対称</button>
            <button className={`chip ${grid ? 'chip-on' : ''}`} onClick={() => setGrid(!grid)}># グリッド</button>
            <div className="flex-1" />
            <div className="flex bg-black/30 p-0.5 rounded text-xs">
              {([['before', '元画像'], ['split', '比較'], ['after', '結果']] as [ViewMode, string][]).map(([v, l]) => (
                <button key={v} onClick={() => setView(v)} className={`px-2.5 py-1 rounded ${view === v ? 'bg-lime-600' : 'hover:bg-zinc-700'}`}>{l}</button>
              ))}
            </div>
            <select value={bg} onChange={(e) => setBg(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-xs">
              {BGS.map(([v, l]) => <option key={v} value={v}>背景: {l}</option>)}
            </select>
            <label className="flex items-center gap-1 text-xs text-zinc-400">
              🔍<input type="range" min={128} max={900} step={16} value={zoom} onChange={(e) => setZoom(+e.target.value)} className="w-24 accent-lime-500" />
            </label>
          </div>

          <div
            className="flex-1 overflow-auto flex items-center justify-center p-6 relative"
            style={{
              backgroundImage: `linear-gradient(rgba(14,14,18,.86), rgba(14,14,18,.86)), url(${dirtUrl})`,
              backgroundSize: 'auto, 64px 64px',
              backgroundRepeat: 'repeat',
              imageRendering: 'pixelated',
            }}
          >
            <PixelCanvas
              base={doc.base} output={output} view={view} grid={grid} zoom={zoom} tool={tool} color={color}
              brush={brush} mirror={mirror} bg={bgCss(bg)}
              onStroke={(t, key) => update((d) => ({ ...d, base: t }), key)}
              onPick={(h) => { setColor(h); setTool('pencil'); say(`色を取得: ${h}`); }}
            />
            {dragOver && (
              <div className="absolute inset-4 border-4 border-dashed border-lime-400 bg-lime-500/10 flex items-center justify-center text-xl font-pixel pointer-events-none rounded">
                ここにテクスチャをドロップ
              </div>
            )}
          </div>

          {/* animation bar */}
          <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-[#1e1e23] border-t-2 border-black text-xs">
            {animated ? (
              <>
                <button className="btn !py-1" onClick={() => setPlaying(!playing)}>{playing ? '⏸ 停止' : '▶ 再生'}</button>
                <input type="range" min={0} max={totalFrames - 1} value={fi} onChange={(e) => { setPlaying(false); setFrame(+e.target.value); }} className="flex-1 min-w-[120px] accent-fuchsia-500" />
                <span className="font-mono text-zinc-400 w-14">{fi + 1}/{totalFrames}</span>
                <label className="flex items-center gap-1 text-zinc-400">フレーム数
                  <select value={frameCount} onChange={(e) => setFrameCount(+e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-zinc-100">
                    {[4, 8, 12, 16, 24, 32].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-1 text-zinc-400">速度
                  <select value={fps} onChange={(e) => setFps(+e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-zinc-100">
                    {[2, 4, 5, 10, 20].map((n) => <option key={n} value={n}>{n}fps (frametime {Math.round(20 / n)})</option>)}
                  </select>
                </label>
              </>
            ) : (
              <span className="text-zinc-500">🎞️ アニメ系エフェクト（エンチャント・きらめき・波打ち等）を追加すると、マイクラ用アニメーションテクスチャとして書き出せます</span>
            )}
            <span className="ml-auto text-zinc-600 hidden xl:inline">B:ペン E:消しゴム G:塗り I:スポイト Space:再生 ・ 画像はドラッグ&ドロップ / Ctrl+V でも読み込めます</span>
          </div>
        </main>

        {/* RIGHT */}
        <aside className="lg:w-80 bg-[#1b1b1f] border-l-4 border-black flex flex-col lg:max-h-[calc(100vh-60px)]">
          <div className="p-2 border-b border-zinc-800">
            <div className="flex gap-1 mb-2">
              {([['3d', '🧊 3Dプレビュー'], ['tile', '🔲 タイル'], ['frames', '🎞️ フレーム']] as const).map(([v, l]) => (
                <button key={v} onClick={() => { setPreview(v); if (v === 'frames') setPlaying(false); }} className={`tab flex-1 ${preview === v ? 'tab-on' : ''}`}>{l}</button>
              ))}
            </div>
            {preview === '3d' && <div className="flex items-center justify-end gap-2 mb-1 text-[11px] text-zinc-400">
              表示タイプ
              <select value={previewShape} onChange={(e) => setPreviewShape(e.target.value as typeof previewShape)} className="bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-zinc-100">
                <option value="auto">自動</option><option value="block">ブロック</option><option value="item">アイテム</option>
              </select>
            </div>}
            <div className="rounded overflow-hidden" style={{ background: preview === '3d' ? 'radial-gradient(circle, #3a4a60, #15151a)' : undefined }}>
              {preview === '3d' && <Block3D url={outputUrl} item={showAsItem} />}
              {preview === 'tile' && <TilePreview url={outputUrl} w={output.w} h={output.h} bg={bgCss(bg)} />}
              {preview === 'frames' && (
                <div className="h-52 overflow-y-auto grid grid-cols-4 gap-1 p-1 scroll-thin" style={{ background: bgCss('checker') }}>
                  {frameUrls.map((u, i) => (
                    <button key={i} onClick={() => { setPlaying(false); setFrame(i); }} className={`border-2 ${i === fi ? 'border-fuchsia-500' : 'border-black'}`}>
                      <img src={u} alt="" className="w-full" style={{ imageRendering: 'pixelated' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-zinc-500">実寸:</span>
              <img src={outputUrl} alt="" style={{ width: output.w > 64 ? 64 : output.w, imageRendering: 'pixelated' }} />
              <img src={outputUrl} alt="" style={{ width: 32, imageRendering: 'pixelated' }} />
              <img src={outputUrl} alt="" style={{ width: 64, imageRendering: 'pixelated' }} />
              <input className="ml-auto bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-xs w-28 font-mono" value={doc.name}
                onChange={(e) => update((d) => ({ ...d, name: e.target.value.replace(/[^\w\-.]/g, '_') }), 'name')} title="ファイル名" />
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <h2 className="font-pixel text-sm">レイヤー <span className="text-zinc-500 text-xs">({doc.layers.length})</span></h2>
            <button className="text-[11px] text-zinc-400 hover:text-red-400" onClick={() => update((d) => ({ ...d, layers: [] }))} disabled={!doc.layers.length}>すべて削除</button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-3 scroll-thin">
            <LayerPanel layers={doc.layers} selected={selected} onSelect={setSelected} onChange={changeLayer}
              onMove={moveLayer} onRemove={removeLayer} onDuplicate={duplicateLayer} />
            <div className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded border-2 border-zinc-800 text-xs text-zinc-500">
              🖼️ 元画像 <span className="font-mono">{doc.base.w}×{doc.base.h}</span>{isItem ? '（アイテム/透過）' : '（ブロック）'}
            </div>
          </div>
        </aside>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 mc-tip px-4 py-2 text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
