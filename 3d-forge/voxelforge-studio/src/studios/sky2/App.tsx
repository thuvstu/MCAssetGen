"use client";

import "./studio.css";
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { motion as motionUI } from 'framer-motion';
import { Logo } from './components/Logo';
import { Catalog } from './components/Catalog';
import { Controls } from './components/Controls';
import { Stage, type Tool } from './components/Stage';
import { Strip, type Entry } from './components/Strip';
import { forge, toStrip, type Motion } from './lib/engine';
import { measure } from './lib/measure';
import { ESSENCE, PRESETS, TOTAL_ICONS, type PackId, type StyleParams } from './lib/essence';
import { CATALOG, type CatItem } from './lib/catalog';
import { ARCHES, type ArchId, type Design } from './lib/archetypes';
import { buildPack, packNamespace, rgbaToPng, type Target } from './lib/exporter';
import { applyEdits, editKey, paletteOf, pack4, brushOffsets, type EditMap } from './lib/edits';
import { createThemedItem } from './lib/forgeThemes';
import { hash2 } from './lib/raster';

let uidSeq = 1;
const rnd = Math.random;

function randomDesign(arch: ArchId): Design {
  const A = ARCHES[arch];
  return {
    arch,
    a: Math.floor(rnd() * A.A.length),
    b: Math.floor(rnd() * A.B.length),
    len: 0.35 + rnd() * 0.6,
    wid: 0.35 + rnd() * 0.6,
    orn: rnd() * 0.9,
    gem: rnd() > 0.4,
    rune: rnd() > 0.45,
    coreMode: Math.floor(rnd() * 4),
    offsetX: 0,
    offsetY: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
    autoFit: true,
    adornment: (['none', 'filigree', 'crest', 'petals', 'thorns', 'sigil', 'orbitals', 'cross', 'crown', 'flame'] as const)[
      Math.floor(rnd() * 10)
    ],
    pull: 0,
  };
}

const STORE = 'skyblock-forge.v3';
type Saved = { work: CatItem; pack: PackId; n: 16 | 32 | 64; light: number; entries: CatItem[]; packName: string; target: Target; edits: Record<string, EditMap>; styles: Partial<Record<PackId, Partial<StyleParams>>>; motion: Motion };
function loadSaved(): Partial<Saved> {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return {};
    const v = JSON.parse(raw) as Partial<Saved>;
    // guard against stale shapes: only accept a work item whose archetype still exists
    if (v.work && !ARCHES[v.work.design?.arch]) delete v.work;
    if (v.pack && !PRESETS[v.pack]) delete v.pack;
    if (v.entries) v.entries = v.entries.filter((e) => ARCHES[e.design?.arch]);
    return v;
  } catch {
    return {};
  }
}
const SAVED = loadSaved();

export default function App() {
  const [work, setWork] = useState<CatItem>(SAVED.work ?? CATALOG[0]);
  const [pack, setPack] = useState<PackId>(SAVED.pack ?? 'furfsky');
  const [n, setN] = useState<16 | 32 | 64>(SAVED.n ?? 64);
  const [light, setLight] = useState(SAVED.light ?? 135);
  const [entries, setEntries] = useState<Entry[]>(() => (SAVED.entries ?? []).map((e) => ({ ...e, uid: uidSeq++ })));
  const [packName, setPackName] = useState(SAVED.packName ?? 'Forge Reborn 64x');
  const [target, setTarget] = useState<Target>(SAVED.target ?? 'catharsis');
  const [edits, setEdits] = useState<Record<string, EditMap>>(SAVED.edits ?? {});
  const [styles, setStyles] = useState<Partial<Record<PackId, Partial<StyleParams>>>>(SAVED.styles ?? {});
  const [fxMotion, setFxMotion] = useState<Motion>(SAVED.motion ?? { intensity: 0.75, speed: 1, density: 0.55 });
  const [undo, setUndo] = useState<{ key: string; map: EditMap }[]>([]);
  const [tool, setTool] = useState<Tool>('view');
  const [color, setColor] = useState<number>(pack4(255, 255, 255, 255));
  const [brushSize, setBrushSize] = useState(1);
  const [fillTolerance, setFillTolerance] = useState(0);
  const [variantSeed, setVariantSeed] = useState(1);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const style = useMemo(() => {
    const o = styles[pack] ?? {};
    return {
      ...PRESETS[pack],
      ...o,
      ramp: { ...PRESETS[pack].ramp, ...o.ramp },
      colors: { ...PRESETS[pack].colors, ...o.colors },
    };
  }, [pack, styles]);
  const ess = ESSENCE[pack];
  // Thumbnails lag behind the live canvas on purpose: the main preview stays
  // responsive while a slider is dragged and the library renders catch up.
  const deferredStyle = useDeferredValue(style);
  const deferredLight = useDeferredValue(light);
  const motionPatch = (p: Partial<Motion>) => setFxMotion((v) => ({ ...v, ...p }));
  const stylePatch = (p: Partial<StyleParams>) => setStyles((all) => {
    const old = all[pack] ?? {};
    return { ...all, [pack]: { ...old, ...p, ...(p.ramp ? { ramp: { ...(old.ramp ?? {}), ...p.ramp } } : {}), ...(p.colors ? { colors: { ...(old.colors ?? {}), ...p.colors } } : {}) } };
  });
  const resetStyle = () => setStyles((all) => { const next = { ...all }; delete next[pack]; return next; });
  const styleKey = JSON.stringify({ style, fxMotion });
  const rawFg = useMemo(() => forge({ n, design: work.design, mats: work.mats, style, light, anim: work.anim, seed: 7, motion: fxMotion }), [n, work, style, light, fxMotion]);
  const key = editKey(work, n, pack, light, styleKey);
  const fg = useMemo(() => applyEdits(rawFg, edits[key]), [rawFg, edits, key]);
  const palette = useMemo(() => paletteOf(rawFg.frames[0]), [rawFg]);
  const currentEdits = edits[key] ?? {};
  const editCount = Object.keys(edits[key] ?? {}).length;
  const pulls = useMemo(
    () => (work.design.arch === 'bow' ? [1, 2, 3].map((k) => forge({ n, design: { ...work.design, pull: k }, mats: work.mats, style, light, anim: 'none', seed: 7, motion: fxMotion }).frames[0]) : null),
    [n, work, style, light, fxMotion],
  );
  const variants = useMemo(() => {
    const A = ARCHES[work.design.arch];
    return Array.from({ length: 12 }, (_, i) => {
      const h = (k: number) => hash2(i * 13 + variantSeed * 101, k, variantSeed);
      const design: Design = { ...work.design, a: Math.floor(h(1) * A.A.length), b: Math.floor(h(2) * A.B.length), len: h(3), wid: h(4), orn: h(5), gem: h(6) > 0.45, rune: h(7) > 0.55, pull: 0 };
      return { design, rgba: forge({ n: 32, design, mats: work.mats, style: deferredStyle, light: deferredLight, anim: 'none', seed: 7, motion: fxMotion }).frames[0] };
    });
  }, [work.design, work.mats, deferredStyle, deferredLight, fxMotion, variantSeed]);

  useEffect(() => {
    // the chosen colour must always come from the current palette
    if (palette.length && !palette.includes(color)) setColor(palette[Math.floor(palette.length * 0.6)]);
  }, [palette, color]);

  useEffect(() => {
    try {
      const saved: Saved = { work, pack, n, light, entries: entries.map(({ uid: _u, ...rest }) => rest), packName, target, edits, styles, motion: fxMotion };
      localStorage.setItem(STORE, JSON.stringify(saved));
    } catch {
      /* storage full or disabled — the session still works */
    }
  }, [work, pack, n, light, entries, packName, target, edits, styles, fxMotion]);

  const stroke = () => setUndo((u) => [...u.slice(-59), { key, map: { ...(edits[key] ?? {}) } }]);
  const paint = (i: number) => {
    setEdits((prev) => {
      const map = { ...(prev[key] ?? {}) };
      const cx = i % n;
      const cy = Math.floor(i / n);
      for (const [dx, dy] of brushOffsets(brushSize)) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= n || y >= n) continue;
        const j = y * n + x;
        if (tool === 'restore') delete map[j];
        else map[j] = tool === 'erase' ? pack4(0, 0, 0, 0) : color;
      }
      const next = { ...prev };
      if (Object.keys(map).length) next[key] = map;
      else delete next[key];
      return next;
    });
  };
  const doUndo = () => {
    setUndo((u) => {
      const last = u[u.length - 1];
      if (!last) return u;
      setEdits((prev) => {
        const next = { ...prev };
        if (Object.keys(last.map).length) next[last.key] = last.map;
        else delete next[last.key];
        return next;
      });
      return u.slice(0, -1);
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); return; }
      const m: Record<string, Tool> = { v: 'view', b: 'pencil', g: 'fill', x: 'replace', e: 'erase', r: 'restore', i: 'pick' };
      const tt = m[e.key.toLowerCase()];
      if (tt && !e.ctrlKey && !e.metaKey && !e.altKey) { setTool(tt); return; }
      // brush sizing: [ / ] step, 1–4 jump
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '[') { setBrushSize((s) => Math.max(1, s - 1)); return; }
        if (e.key === ']') { setBrushSize((s) => Math.min(4, s + 1)); return; }
        if (e.key >= '1' && e.key <= '4') { setBrushSize(parseInt(e.key, 10)); return; }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const metrics = useMemo(() => measure(fg.frames[0], n), [fg, n]);
  const catThumbs = useMemo(
    () =>
      Object.fromEntries(
        CATALOG.map((it) => [
          it.id,
          forge({ n: 32, design: it.design, mats: it.mats, style: deferredStyle, light: deferredLight, anim: 'none', seed: 7 }).frames[0],
        ]),
      ),
    [deferredStyle, deferredLight],
  );
  const entryThumbs = useMemo(
    () =>
      Object.fromEntries(
        entries.map((e) => [
          e.uid,
          forge({ n: 32, design: e.design, mats: e.mats, style: deferredStyle, light: deferredLight, anim: 'none', seed: 7 }).frames[0],
        ]),
      ),
    [entries, deferredStyle, deferredLight],
  );
  const shelf = entries.length ? entries.map((e) => entryThumbs[e.uid]) : CATALOG.map((it) => catThumbs[it.id]);

  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 3200);
  };
  const patch = (p: Partial<CatItem>) => setWork((w) => ({ ...w, ...p }));
  const newDesign = () => patch({ design: randomDesign(work.design.arch) });
  const randomAll = () => {
    const item = createThemedItem();
    setWork(item);
    flash(`テーマ生成: ${item.en}（${item.jp}）`);
  };
  const addCurrent = () => {
    setEntries((l) => [...l.filter((e) => e.id !== work.id), { ...work, uid: uidSeq++ }]);
    flash(`${work.en}（${work.id}）をパックに追加`);
  };
  const addAll = () => {
    setEntries(CATALOG.map((it) => ({ ...it, uid: uidSeq++ })));
    flash(`カタログ ${CATALOG.length} 件を投入`);
  };
  const savePng = async () => {
    const blob = await rgbaToPng(toStrip(fg), n, n * fg.frames.length);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${work.id.toLowerCase()}_${n}x${fg.frames.length > 1 ? `_${fg.frames.length}f` : ''}.png`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    flash(fg.frames.length > 1 ? `縦 ${fg.frames.length} フレームのアニメ strip を保存（frametime ${fg.frametime}）` : 'PNG を保存');
  };
  const exportZip = async () => {
    if (!entries.length) return;
    setBusy(true);
    try {
      const blob = await buildPack(entries, { name: packName, target, n, style, light, motion: fxMotion, styleName: ess.name, editsFor: (e) => edits[editKey(e, n, pack, light, styleKey)] });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob as Blob);
      a.download = `${packName.replace(/[^\w\- ]/g, '').trim() || 'skyblock-pack'}.zip`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      const targetName = target === 'catharsis' ? 'Catharsis' : target === 'optifine' ? 'OptiFine CIT' : 'Vanilla item_model + datapack';
      flash(`書き出し完了 — ${entries.length} テクスチャ · ${n}x · ${targetName}`);
    } catch {
      flash('書き出しに失敗しました');
    } finally {
      setBusy(false);
    }
  };

  const ticker = [
    `MEASURED ${TOTAL_ICONS.toLocaleString()} REAL ITEM ICONS`,
    ...Object.values(ESSENCE).map((e) => `${e.name}: ${e.colors} colors · dark outline ${Math.round(e.darker * 100)}% · black 0%`),
    'FurfSky 42.5% · ImperiaL\'s (PacksHQ) 33.0% · Vanilla+ 25.2% · Faithful 32x 7.9% · SkyPixel 5.2% — Hypixel Forums poll',
    'CATHARSIS FORMAT: assets/skyblock/items/<id>.json',
  ];

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <img src="/images/backdrop.jpg" alt="" className="h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/85 to-ink" />
        <div className="noise absolute inset-0 opacity-[0.08] mix-blend-overlay" />
      </div>

      <header className="relative z-20 border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3.5">
            <Logo size={36} />
            <div>
              <div className="font-mono text-[9.5px] font-bold tracking-[0.32em] text-gold">SKYBLOCK TEXTURE FORGE · ESSENCE ENGINE</div>
              <h1 className="font-display text-[clamp(22px,2.8vw,34px)] leading-none text-bone">
                <span className="text-gold">64×64</span> テクスチャ工房
              </h1>
            </div>
          </div>
          <div className="hidden border border-white/10 md:flex">
            {[
              ['MEASURED', `${(TOTAL_ICONS / 1000).toFixed(1)}k icons`],
              ['STYLE', ess.name.split(' ')[0]],
              ['NATIVE', `${n}×${n}`],
              ['IN PACK', String(entries.length)],
            ].map(([k, v]) => (
              <div key={k} className="border-r border-white/10 px-3.5 py-1.5 text-right last:border-r-0">
                <div className="font-mono text-[8.5px] tracking-[0.2em] text-mist">{k}</div>
                <div className="font-mono text-[14px] leading-tight text-bone">{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 overflow-hidden border-t border-white/8 bg-black/55 py-1.5">
          <span className="ml-4 shrink-0 border border-gold/50 bg-gold/10 px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.16em] text-gold">ESSENCE LAB</span>
          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div className="marquee flex w-max whitespace-nowrap font-mono text-[10.5px] text-mist">
              {[0, 1].map((d) => (
                <span key={d} className="flex gap-8 pr-8">
                  {ticker.map((t, i) => (
                    <span key={i} className="flex items-center gap-2"><span className="inline-block h-1 w-1 bg-gold" />{t}</span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)_340px]">
        <motionUI.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="order-3 min-h-0 lg:order-1 lg:h-full">
          <Catalog activeId={work.id} thumbs={catThumbs} onPick={(it) => setWork(it)} />
        </motionUI.div>
        <motionUI.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} className="order-1 min-h-0 bg-black/25 lg:order-2 lg:h-full">
          <Stage
            fg={fg} n={n} work={work} metrics={metrics} pack={ess} thumbs={shelf} pulls={pulls} variants={variants} palette={palette}
            tool={tool} setTool={setTool} color={color} setColor={setColor} edits={currentEdits} editCount={editCount}
            brushSize={brushSize} setBrushSize={setBrushSize} fillTolerance={fillTolerance} setFillTolerance={setFillTolerance}
            canUndo={undo.length > 0}
            onStroke={stroke} onPaint={paint}
            onApplyEditMap={(map) => setEdits((prev) => ({ ...prev, [key]: map }))}
            onUndo={doUndo} onClearEdits={() => { stroke(); setEdits((p) => { const x = { ...p }; delete x[key]; return x; }); }}
            onPickVariant={(d) => patch({ design: d })} onReroll={() => setVariantSeed((v) => v + 1)}
            onAdd={addCurrent} onSave={savePng} onNew={newDesign} onRandom={randomAll}
            target={target}
            modernCommand={`/function ${packNamespace(packName)}:give/${work.id.toLowerCase()}`}
            onCopyCommand={(cmd) => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(cmd);
                flash('/give コマンドをクリップボードにコピーしました！');
              } else {
                flash(cmd);
              }
            }}
          />
        </motionUI.section>
        <motionUI.aside initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="order-2 min-h-0 lg:order-3 lg:h-full">
          <Controls
            pack={pack} setPack={setPack} n={n} setN={setN} work={work} patch={patch}
            style={style} stylePatch={stylePatch} resetStyle={resetStyle} motion={fxMotion} setMotion={motionPatch}
            light={light} setLight={setLight} onNewDesign={newDesign} onRandomAll={randomAll}
            onTheme={(id) => {
              const item = createThemedItem(id);
              setWork(item);
              flash(`${item.en} をテーマ ${id} から生成しました`);
            }}
          />
        </motionUI.aside>
      </main>

      <Strip
        entries={entries} thumbs={entryThumbs} activeId={work.id} packName={packName} setPackName={setPackName} target={target} setTarget={setTarget}
        onPick={(e) => setWork(e)} onRemove={(uid) => setEntries((l) => l.filter((e) => e.uid !== uid))} onAdd={addCurrent} onAddAll={addAll}
        onClear={() => setEntries([])} onExport={exportZip} busy={busy} n={n}
      />

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <motionUI.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="border border-gold/60 bg-ink/95 px-4 py-2.5 font-mono text-[11.5px] text-gold shadow-[0_20px_40px_-20px_rgba(255,170,0,0.7)]">
            {toast}
          </motionUI.div>
        </div>
      )}
    </div>
  );
}
