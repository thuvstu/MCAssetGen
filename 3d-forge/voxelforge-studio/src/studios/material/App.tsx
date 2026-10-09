"use client";

import "./studio.css";
import { useMemo, useState, useCallback } from 'react';
import PixelCanvas from './components/PixelCanvas';
import ControlPanel from './components/ControlPanel';
import { SHAPES, CATEGORY_LABEL, SHAPE_ROLES, type ShapeCategory } from './lib/shapes';
import {
  renderPixels,
  pixelsToBlob,
  spritesheetBlob,
  downloadBlob,
  fileNameFor,
  safeName,
  type MaterialSettings,
  type Edits,
} from './lib/render';
import { makePalette } from './lib/color';
import { FX_DEFAULT } from './lib/presets';
import { buildZip, englishName, japaneseName } from './lib/pack';

const DEFAULT: MaterialSettings = {
  name: 'copper',
  base: '#c47a45',
  secondary: '#5fb08a',
  contrast: 1,
  hueShift: 10,
  outline: true,
  saturationBoost: 0,
  seed: 1337,
  noiseAmount: 0.8,
  sparkle: true,
  ...FX_DEFAULT,
};

const CATS: ShapeCategory[] = ['metal', 'gem', 'raw', 'block', 'part', 'relic'];

export default function App() {
  const [settings, setSettings] = useState<MaterialSettings>(DEFAULT);
  const [selectedId, setSelectedId] = useState<string>('ingot');
  const [edits, setEdits] = useState<Edits>({});
  const [brush, setBrush] = useState<string>('b');
  const [exportScale, setExportScale] = useState<number>(1);
  const [filter, setFilter] = useState<ShapeCategory | 'all'>('all');
  const [busy, setBusy] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [modId, setModId] = useState('mymod');
  const [asPack, setAsPack] = useState(true);

  const patch = useCallback((p: Partial<MaterialSettings>) => setSettings((s) => ({ ...s, ...p })), []);

  const rendered = useMemo(
    () => SHAPES.map((sh) => ({ shape: sh, pixels: renderPixels(sh, settings, edits) })),
    [settings, edits],
  );

  const selected = rendered.find((r) => r.shape.id === selectedId) ?? rendered[0];
  const palette = useMemo(() => makePalette(settings), [settings]);

  const visible = filter === 'all' ? rendered : rendered.filter((r) => r.shape.category === filter);

  const paint = useCallback(
    (index: number, erase: boolean) => {
      setEdits((prev) => {
        const cur = { ...(prev[selected.shape.id] ?? {}) };
        const original = selected.shape.rows[(index / 16) | 0][index % 16];
        const ch = erase ? '.' : brush;
        if (ch === original) delete cur[index];
        else cur[index] = ch;
        return { ...prev, [selected.shape.id]: cur };
      });
    },
    [brush, selected.shape],
  );

  const editCount = Object.keys(edits[selected.shape.id] ?? {}).length;

  const downloadOne = async (idx: number) => {
    const { shape, pixels } = rendered[idx];
    const blob = await pixelsToBlob(pixels, exportScale);
    downloadBlob(blob, `${fileNameFor(shape.file, settings.name)}.png`);
  };

  const downloadZip = async () => {
    setBusy(true);
    try {
      const out = await buildZip(rendered, settings, palette, { modId, scale: exportScale, asPack });
      downloadBlob(out, `${safeName(settings.name)}_${asPack ? 'resourcepack' : 'textures'}.zip`);
    } finally {
      setBusy(false);
    }
  };

  const downloadSheet = async () => {
    const blob = await spritesheetBlob(
      rendered.map((r) => r.pixels),
      exportScale,
      8,
    );
    downloadBlob(blob, `${safeName(settings.name)}_spritesheet.png`);
  };

  const roleColor = (ch: string): string => {
    switch (ch) {
      case '#':
        return palette.outline;
      case 'd':
        return palette.deep;
      case 's':
        return palette.shadow;
      case 'b':
        return palette.base;
      case 'l':
        return palette.light;
      case 'h':
        return palette.highlight;
      case 'w':
        return palette.white;
      case 'g':
        return palette.glow;
      case '2':
        return palette.sec;
      case '3':
        return palette.secLight;
      case '4':
        return palette.secShadow;
      case 'n':
        return `repeating-linear-gradient(45deg, ${palette.shadow} 0 3px, ${palette.light} 3px 6px)`;
      default:
        return 'repeating-conic-gradient(#555 0 25%, #333 0 50%) 0 0/8px 8px';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 grid-cols-2 overflow-hidden rounded border border-zinc-700 shadow-[0_0_0_1px_#000]">
              <span style={{ background: palette.highlight }} />
              <span style={{ background: palette.light }} />
              <span style={{ background: palette.base }} />
              <span style={{ background: palette.shadow }} />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight">Minecraft Asset Maker</h1>
              <p className="text-[11px] text-zinc-400">素材・レリックのテクスチャ生成 — インゴット / 宝石 / 遺物 ほか {SHAPES.length} 形状</p>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <label className="flex items-center gap-1.5 text-xs text-zinc-400">
              Mod ID
              <input
                value={modId}
                onChange={(e) => setModId(e.target.value)}
                spellCheck={false}
                className="w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-400"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-zinc-400" title="assets/<modid>/textures/… + lang + pack.mcmeta の構成で出力">
              <input type="checkbox" checked={asPack} onChange={(e) => setAsPack(e.target.checked)} className="accent-emerald-400" />
              リソースパック構成
            </label>
            <label className="flex items-center gap-1.5 text-xs text-zinc-400">
              出力サイズ
              <select
                value={exportScale}
                onChange={(e) => setExportScale(parseInt(e.target.value, 10))}
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
              >
                <option value={1}>16×16 (MC標準)</option>
                <option value={2}>32×32</option>
                <option value={4}>64×64</option>
                <option value={8}>128×128</option>
              </select>
            </label>
            <button
              onClick={downloadSheet}
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-emerald-400"
            >
              スプライトシート
            </button>
            <button
              onClick={downloadZip}
              disabled={busy}
              className="rounded bg-emerald-500 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {busy ? '生成中…' : `全${SHAPES.length}枚をZIPで保存`}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[300px_1fr_360px]">
        {/* Left: controls */}
        <aside className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 lg:sticky lg:top-[64px] lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto">
          <ControlPanel settings={settings} onChange={patch} />
        </aside>

        {/* Center: gallery */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-full px-3 py-1 text-xs ${filter === 'all' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            >
              すべて ({SHAPES.length})
            </button>
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`rounded-full px-3 py-1 text-xs ${filter === c ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
              >
                {CATEGORY_LABEL[c]} ({SHAPES.filter((s) => s.category === c).length})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
            {visible.map(({ shape, pixels }) => {
              const idx = rendered.findIndex((r) => r.shape.id === shape.id);
              const active = shape.id === selected.shape.id;
              const hasEdits = Object.keys(edits[shape.id] ?? {}).length > 0;
              return (
                <div
                  key={shape.id}
                  className={`group relative flex flex-col items-center rounded-lg border p-2 transition ${
                    active ? 'border-emerald-400 bg-zinc-800' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                  }`}
                >
                  <button onClick={() => setSelectedId(shape.id)} className="checker rounded-md p-1.5">
                    <PixelCanvas pixels={pixels} scale={4} />
                  </button>
                  <div className="mt-1.5 w-full text-center">
                    <div className="truncate text-xs font-medium">{shape.name}</div>
                    <div className="truncate font-mono text-[10px] text-zinc-500">{fileNameFor(shape.file, settings.name)}.png</div>
                  </div>
                  {hasEdits && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-amber-500/90 px-1 text-[9px] font-bold text-zinc-950">編集済</span>
                  )}
                  <button
                    onClick={() => downloadOne(idx)}
                    title="PNGを保存"
                    className="absolute right-1.5 top-1.5 rounded bg-zinc-950/80 p-1 text-zinc-300 opacity-0 transition hover:text-emerald-300 group-hover:opacity-100"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: detail / editor */}
        <aside className="space-y-4 lg:sticky lg:top-[64px] lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="mb-2 flex items-start justify-between">
              <div className="min-w-0">
                <h2 className="text-sm font-bold">{selected.shape.name}</h2>
                <p className="truncate font-mono text-[11px] text-zinc-500">
                  textures/{selected.shape.category === 'block' ? 'block' : 'item'}/{fileNameFor(selected.shape.file, settings.name)}.png
                </p>
                <p className="truncate text-[11px] text-zinc-400">
                  {englishName(selected.shape, settings.name)} / {japaneseName(selected.shape, settings.name)}
                </p>
              </div>
              <button
                onClick={() => downloadOne(rendered.indexOf(selected))}
                className="rounded bg-emerald-500 px-2.5 py-1 text-xs font-bold text-zinc-950 hover:bg-emerald-400"
              >
                PNG保存
              </button>
            </div>

            <div className="checker flex justify-center rounded-md p-2">
              <PixelCanvas
                pixels={selected.pixels}
                scale={18}
                grid={showGrid}
                onPaint={paint}
                className="cursor-crosshair rounded-sm"
                title="クリック/ドラッグで描画、Shift+ドラッグまたは右クリックで消去"
              />
            </div>

            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-zinc-400">ブラシ(パレット役割)</span>
                <label className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="accent-emerald-400" />
                  グリッド
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SHAPE_ROLES.map((r) => (
                  <button
                    key={r.char}
                    onClick={() => setBrush(r.char)}
                    title={r.label}
                    className={`flex items-center gap-1.5 rounded border px-1.5 py-1 text-[11px] ${
                      brush === r.char ? 'border-emerald-400 bg-zinc-800 text-white' : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                    }`}
                  >
                    <span className="h-4 w-4 rounded-sm border border-black/50" style={{ background: roleColor(r.char) }} />
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Shift+ドラッグ / 右クリックで消去</span>
                <button
                  onClick={() => setEdits((e) => ({ ...e, [selected.shape.id]: {} }))}
                  disabled={editCount === 0}
                  className="rounded border border-zinc-700 px-2 py-0.5 text-zinc-300 hover:border-amber-400 disabled:opacity-40"
                >
                  編集をリセット ({editCount})
                </button>
              </div>
            </div>
          </div>

          {/* Inventory preview */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-400">ゲーム内プレビュー</h3>
            <div className="rounded-md border-2 border-[#555] bg-[#c6c6c6] p-2 shadow-[inset_2px_2px_0_#fff,inset_-2px_-2px_0_#555]">
              <div className="flex gap-0.5">
                {[selected, ...rendered.filter((r) => r !== selected).slice(0, 4)].map(({ shape, pixels }) => (
                  <div
                    key={shape.id}
                    className="flex h-[52px] w-[52px] items-center justify-center bg-[#8b8b8b] shadow-[inset_2px_2px_0_#373737,inset_-2px_-2px_0_#fff]"
                  >
                    <PixelCanvas pixels={pixels} scale={3} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-end gap-4">
              <div>
                <p className="mb-1 text-[11px] text-zinc-500">実寸 (1x)</p>
                <div className="checker inline-block rounded p-1">
                  <PixelCanvas pixels={selected.pixels} scale={1} />
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-zinc-500">2x</p>
                <div className="checker inline-block rounded p-1">
                  <PixelCanvas pixels={selected.pixels} scale={2} />
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-zinc-500">暗背景</p>
                <div className="inline-block rounded bg-zinc-950 p-1">
                  <PixelCanvas pixels={selected.pixels} scale={3} />
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-zinc-500">明背景</p>
                <div className="inline-block rounded bg-zinc-100 p-1">
                  <PixelCanvas pixels={selected.pixels} scale={3} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-[11px] leading-relaxed text-zinc-400">
            <p className="mb-1 font-bold text-zinc-300">使い方</p>
            <ol className="list-decimal space-y-0.5 pl-4">
              <li>左でプリセットを選ぶか、ベース色を指定</li>
              <li>コントラスト・色相シフトで陰影を調整し、質感エフェクト(ブラシ目・ファセット・パティーナ・発光)で仕上げ</li>
              <li>中央で形状を選び、右で1ピクセル単位の微調整が可能</li>
              <li>「リソースパック構成」でZIP保存すると <code className="text-emerald-300">assets/&lt;modid&gt;/textures/item|block/</code> と言語ファイル(en_us / ja_jp)、pack.mcmeta 付きで出力されます</li>
            </ol>
          </div>
        </aside>
      </main>
    </div>
  );
}
