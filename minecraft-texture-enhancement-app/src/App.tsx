import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Stage from "./components/Stage";
import EffectStack from "./components/EffectStack";
import PixelDrawToolbar from "./components/PixelDrawToolbar";
import TextureLibrary, { presetToInsts } from "./components/TextureLibrary";
import { Icon, Btn, Toggle, Select } from "./components/ui";
import { renderPipeline, countColors, makeInst, FX_BY_ID, ALL_FX, isAnimated, type Inst } from "./lib/pipeline";
import { generateTexture, imageFileToImageData, TEX_BY_ID } from "./lib/textures";
import McPackModal from "./components/McPackModal";
import type { PackEntry } from "./lib/mcpack";
import type { Preset } from "./lib/presets";
import { cn } from "./utils/cn";

const QUICK = ["enchantGlint", "outerGlow", "outline", "ditherBayer", "moss", "frame", "bloom", "sparkle"];

interface Snap { insts: Inst[]; texId: string | null; size: number; seed: number; customName: string | null }

export default function App() {
  const [texId, setTexId] = useState<string | null>("diamond_sword");
  const [customName, setCustomName] = useState<string | null>(null);
  const [customData, setCustomData] = useState<ImageData | null>(null);
  const importedFile = useRef<File | null>(null);
  const [size, setSize] = useState(32);
  const [seed, setSeed] = useState(11);
  const [insts, setInsts] = useState<Inst[]>(() => [
    makeInst("sharpen", { amt: 70 }),
    makeInst("bevel", { amt: 45 }),
    makeInst("rarityAura", { rarity: "legendary", radius: 4, intensity: 95 }),
    makeInst("enchantGlint", { speed: 1.1, width: 11 }),
    makeInst("bloom", { threshold: 160, radius: 3, intensity: 85 }),
  ]);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const [playing, setPlaying] = useState(true);
  const [zoomMode, setZoomMode] = useState(-1);
  const [grid, setGrid] = useState(false);
  const [tile, setTile] = useState(false);
  const [view3d, setView3d] = useState(false);
  const [drawActive, setDrawActive] = useState(false);
  const [drawTool, setDrawTool] = useState<"pencil" | "eraser" | "eyedropper" | "bucket">("pencil");
  const [drawColor, setDrawColor] = useState("#f5a63c");
  const [compare, setCompare] = useState<number | null>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [mcOpen, setMcOpen] = useState(false);
  const [packEntries, setPackEntries] = useState<PackEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [focusUid, setFocusUid] = useState<string | null>(null);

  // ---------- ベーステクスチャ ----------
  const base = useMemo<ImageData>(() => {
    if (customData) return customData;
    return generateTexture(texId || "stone", size, seed);
  }, [customData, texId, size, seed]);

  useEffect(() => {
    if (!importedFile.current) return;
    let alive = true;
    imageFileToImageData(importedFile.current, size).then((d) => { if (alive) setCustomData(d); });
    return () => { alive = false; };
  }, [size, customName]);

  const result = useMemo(() => renderPipeline(base, insts, 0, seed), [base, insts, seed]);
  const colors = useMemo(() => countColors(result), [result]);
  const opaque = useMemo(() => {
    let n = 0;
    for (let i = 3; i < result.data.length; i += 4) if (result.data[i] > 0) n++;
    return n;
  }, [result]);

  const texName = customName || (texId ? (TEX_BY_ID.get(texId)?.name ?? texId) : "—");

  // 手描きピクセルペイント処理
  const handlePixelPaint = (x: number, y: number) => {
    const next = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height);
    const i = (y * size + x) << 2;
    if (drawTool === "pencil") {
      const rgb = parseInt(drawColor.replace("#", ""), 16);
      next.data[i] = (rgb >> 16) & 255;
      next.data[i + 1] = (rgb >> 8) & 255;
      next.data[i + 2] = rgb & 255;
      next.data[i + 3] = 255;
    } else if (drawTool === "eraser") {
      next.data[i + 3] = 0;
    } else if (drawTool === "eyedropper") {
      const r = base.data[i].toString(16).padStart(2, "0");
      const g = base.data[i + 1].toString(16).padStart(2, "0");
      const b = base.data[i + 2].toString(16).padStart(2, "0");
      setDrawColor(`#${r}${g}${b}`);
      return;
    } else if (drawTool === "bucket") {
      // 簡易塗りつぶし
      const targetR = base.data[i], targetG = base.data[i + 1], targetB = base.data[i + 2], targetA = base.data[i + 3];
      const rgb = parseInt(drawColor.replace("#", ""), 16);
      const fillR = (rgb >> 16) & 255, fillG = (rgb >> 8) & 255, fillB = rgb & 255;
      const stack = [[x, y]];
      const seen = new Uint8Array(size * size);
      while (stack.length > 0) {
        const [cx, cy] = stack.pop()!;
        if (cx < 0 || cy < 0 || cx >= size || cy >= size) continue;
        const idx = cy * size + cx;
        if (seen[idx]) continue;
        seen[idx] = 1;
        const pi = idx << 2;
        if (
          Math.abs(base.data[pi] - targetR) < 10 &&
          Math.abs(base.data[pi + 1] - targetG) < 10 &&
          Math.abs(base.data[pi + 2] - targetB) < 10 &&
          Math.abs(base.data[pi + 3] - targetA) < 10
        ) {
          next.data[pi] = fillR;
          next.data[pi + 1] = fillG;
          next.data[pi + 2] = fillB;
          next.data[pi + 3] = 255;
          stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
      }
    }
    setCustomData(next);
    if (!customName) setCustomName("カスタム編集テクスチャ");
  };

  // ---------- 履歴 ----------
  const past = useRef<Snap[]>([]);
  const future = useRef<Snap[]>([]);
  const lastSnap = useRef<string>("");
  const [histVer, setHistVer] = useState(0);
  const snapshot: Snap = { insts, texId, size, seed, customName };
  const snapStr = JSON.stringify(snapshot);

  useEffect(() => {
    if (!lastSnap.current) { lastSnap.current = snapStr; return; }
    const id = setTimeout(() => {
      if (snapStr !== lastSnap.current) {
        past.current.push(JSON.parse(lastSnap.current));
        if (past.current.length > 60) past.current.shift();
        future.current = [];
        lastSnap.current = snapStr;
        setHistVer((v) => v + 1);
      }
    }, 420);
    return () => clearTimeout(id);
  }, [snapStr]);

  const restore = (s: Snap) => {
    setInsts(s.insts); setTexId(s.texId); setSize(s.size); setSeed(s.seed); setCustomName(s.customName);
    if (!s.customName) { importedFile.current = null; setCustomData(null); }
  };
  const undo = useCallback(() => {
    if (!past.current.length) return;
    future.current.push(JSON.parse(lastSnap.current));
    const s = past.current.pop()!;
    lastSnap.current = JSON.stringify(s);
    restore(s); setHistVer((v) => v + 1);
    setToast("元に戻しました");
  }, []);
  const redo = useCallback(() => {
    if (!future.current.length) return;
    past.current.push(JSON.parse(lastSnap.current));
    const s = future.current.pop()!;
    lastSnap.current = JSON.stringify(s);
    restore(s); setHistVer((v) => v + 1);
    setToast("やり直しました");
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(id);
  }, [toast]);

  // ---------- 操作 ----------
  const pickTexture = (id: string) => {
    setTexId(id); setCustomName(null); setCustomData(null); importedFile.current = null; setActivePreset(null);
  };
  const importFile = async (f: File) => {
    try {
      importedFile.current = f;
      const d = await imageFileToImageData(f, size);
      setCustomData(d);
      setCustomName(f.name.replace(/\.[^.]+$/, "").slice(0, 26));
      setTexId(null);
      setActivePreset(null);
      setToast(`「${f.name}」を読み込みました`);
    } catch {
      setToast("画像の読み込みに失敗しました");
    }
  };
  const applyPreset = (p: Preset) => {
    setTexId(p.tex); setCustomName(null); setCustomData(null); importedFile.current = null;
    setSize(p.size);
    setInsts(presetToInsts(p));
    setActivePreset(p.id);
    setToast(`プリセット「${p.name}」を適用`);
  };
  const randomize = () => {
    const cats = ["color", "pixel", "decor", "material", "special"];
    const n = 3 + Math.floor(Math.random() * 4);
    const out: Inst[] = [];
    for (let i = 0; i < n; i++) {
      const cat = cats[Math.floor(Math.random() * cats.length)];
      const pool = ALL_FX.filter((f) => f.cat === cat);
      const d = pool[Math.floor(Math.random() * pool.length)];
      const inst = makeInst(d.id);
      // 数値パラメータをランダム化（既定値を中心に振る）
      for (const p of d.params) {
        if (p.type === "range") {
          const mid = (p.min + p.max) / 2, span = (p.max - p.min) * 0.28;
          const v = clampN(p.def + (Math.random() - 0.5) * span * 2, p.min, p.max);
          inst.values[p.key] = p.step >= 1 ? Math.round(v) : Math.round(v / p.step) * p.step;
          void mid;
        } else if (p.type === "select") {
          inst.values[p.key] = p.options[Math.floor(Math.random() * p.options.length)].v;
        } else if (p.type === "toggle") {
          inst.values[p.key] = Math.random() > 0.5;
        }
      }
      inst.amount = 55 + Math.floor(Math.random() * 46);
      out.push(inst);
    }
    setInsts(out);
    setActivePreset(null);
    setToast("ランダムスタックを生成");
  };

  // ---------- ショートカット ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") { e.preventDefault(); setExportOpen(true); return; }
      if (e.key.toLowerCase() === "g") { setGrid((g) => !g); return; }
      if (e.key.toLowerCase() === "t") { setTile((v) => !v); return; }
      if (e.key === "3") { setView3d((v) => !v); return; }
      if (e.key.toLowerCase() === "m") { setMcOpen(true); return; }
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); return; }
      if (e.key.toLowerCase() === "c") { setCompare((c) => (c === null ? 0.5 : null)); return; }
      if (e.key.toLowerCase() === "r") { setSeed(Math.floor(Math.random() * 9999)); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const setInstsSafe = (next: Inst[]) => { setInsts(next); setActivePreset(null); };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="forge-bg" />

      {/* ================= ヘッダー ================= */}
      <header className="relative z-20 flex h-14 items-center gap-3 border-b border-[var(--line)] bg-[#0e121a]/85 px-3 backdrop-blur-md">
        <button className="lg:hidden" onClick={() => setLeftOpen(true)} title="素材パネル">
          <Icon name="layers" className="h-5 w-5 text-[var(--ink2)]" />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center">
            <svg viewBox="0 0 32 32" className="h-9 w-9 floaty">
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f5a63c" /><stop offset="100%" stopColor="#ef5f8c" />
                </linearGradient>
              </defs>
              <rect x="3" y="3" width="12" height="12" fill="url(#lg1)" />
              <rect x="17" y="3" width="12" height="12" fill="#37d6c4" opacity="0.85" />
              <rect x="3" y="17" width="12" height="12" fill="#59a7ff" opacity="0.8" />
              <rect x="17" y="17" width="12" height="12" fill="#b6e14f" opacity="0.9" />
              <rect x="10" y="10" width="12" height="12" fill="#0e121a" />
              <rect x="13" y="13" width="6" height="6" fill="#ffe066" />
            </svg>
          </span>
          <div className="leading-none">
            <h1 className="font-pixel text-[19px] tracking-wide text-[var(--ink)]">
              PIXEL<span className="text-[var(--amber)]">FORGE</span>
            </h1>
            <p className="mt-1 font-bit text-[8.5px] uppercase tracking-[0.22em] text-[var(--ink3)]">
              Minecraft Texture Studio · 16–128px
            </p>
          </div>
        </div>

        <div className="mx-2 hidden h-7 w-px bg-[var(--line)] md:block" />

        <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
          <span className="truncate rounded-[3px] border border-[var(--line)] bg-[#12171f] px-2 py-1 text-[11px] text-[var(--ink2)]">
            <b className="text-[var(--ink)]">{texName}</b>
            <span className="ml-2 font-bit text-[9px] text-[var(--ink3)]">{size}×{size}</span>
            <span className="ml-2 font-bit text-[9px] text-[var(--ink3)]">SEED {seed}</span>
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {QUICK.map((id) => {
              const d = FX_BY_ID.get(id)!;
              return (
                <button key={id}
                  onClick={() => {
                    const i = makeInst(id);
                    setInstsSafe([...insts, i]);
                    setFocusUid(i.uid);
                    window.setTimeout(() => setFocusUid(null), 2000);
                  }}
                  title={`${d.name} を追加`}
                  className="group flex shrink-0 items-center gap-1 rounded-[3px] border border-[var(--line)] bg-[#141922] px-1.5 py-1 text-[10.5px] text-[var(--ink3)] transition-all hover:-translate-y-px hover:border-[var(--amber)]/60 hover:text-[var(--amber)]">
                  <Icon name={d.icon} className="h-3 w-3" />{d.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Btn size="sm" onClick={undo} disabled={!past.current.length} title="元に戻す (Ctrl+Z)"><Icon name="undo" className="h-3.5 w-3.5" /></Btn>
          <Btn size="sm" onClick={redo} disabled={!future.current.length} title="やり直し (Ctrl+Shift+Z)"><Icon name="redo" className="h-3.5 w-3.5" /></Btn>
          <Btn size="sm" onClick={randomize} accent="#b6e14f" title="ランダム生成"><Icon name="dice" className="h-3.5 w-3.5" /><span className="hidden sm:inline">ランダム</span></Btn>
          <Btn size="sm" active onClick={() => setMcOpen(true)} accent="#b6e14f" title="マイクラ用リソースパックを作る (M)">
            <Icon name="box" className="h-3.5 w-3.5" />マイクラへ{packEntries.length ? ` (${packEntries.length})` : ""}
          </Btn>
          <Btn size="sm" onClick={() => setExportOpen(true)} accent="#37d6c4" title="PNG 書き出し (Ctrl+E)">
            <Icon name="download" className="h-3.5 w-3.5" />書き出し
          </Btn>
          <button className="lg:hidden" onClick={() => setRightOpen(true)} title="エフェクトパネル">
            <Icon name="settings" className="h-5 w-5 text-[var(--ink2)]" />
          </button>
        </div>
        <span className="hidden" data-hist={histVer} />
      </header>

      {/* ================= 本体 ================= */}
      <main className="relative z-10 flex h-[calc(100vh-3.5rem)]">
        {/* 左: 素材 */}
        <aside className={cn(
          "z-30 w-[286px] shrink-0 border-r border-[var(--line)] bg-[#0f131b]/92 backdrop-blur-md",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:h-screen max-lg:shadow-[20px_0_60px_-30px_#000] max-lg:transition-transform",
          leftOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full max-lg:pointer-events-none",
          "hidden lg:block",
        )}>
          <div className="h-full">
            <TextureLibrary
              texId={texId} customName={customName} size={size} seed={seed}
              onPick={pickTexture} onSize={setSize} onSeed={setSeed}
              onImport={importFile} onPreset={applyPreset} activePreset={activePreset}
            />
          </div>
        </aside>

        {/* 中央: ステージ */}
        <section className="relative flex min-w-0 flex-1 flex-col">
          {/* 上部手描き描画ツールバー */}
          <div className="z-10 flex items-center justify-between border-b border-[var(--line)] bg-[#0d1118]/80 px-3 py-1.5 backdrop-blur">
            <PixelDrawToolbar
              active={drawActive}
              onToggleActive={setDrawActive}
              tool={drawTool}
              onChangeTool={setDrawTool}
              color={drawColor}
              onChangeColor={setDrawColor}
              size={size}
            />
            {drawActive && (
              <span className="font-bit text-[9.5px] uppercase tracking-wider text-[var(--rose)] animate-pulse">
                CANVAS EDIT ACTIVE
              </span>
            )}
          </div>

          <Stage
            base={base} insts={insts} result={result} size={size} seed={seed}
            playing={playing} zoomMode={zoomMode} grid={grid} tile={tile} view3d={view3d}
            drawActive={drawActive} onPixelPaint={handlePixelPaint}
            compare={compare}
            texName={customName ? `IMPORT · ${customName}` : texName}
            colors={colors} opaque={opaque}
            onZoom={setZoomMode} onGrid={setGrid} onTile={setTile} onView3d={setView3d} onCompare={setCompare} onPlay={setPlaying}
            onCanvasReady={(cv) => { activeCanvasRef.current = cv; }}
          />
          {/* ステージ下のヒントバー */}
          <div className="flex items-center gap-3 overflow-x-auto border-t border-[var(--line)] bg-[#0e121a]/80 px-3 py-1.5 font-bit text-[9px] uppercase tracking-[0.14em] text-[var(--ink3)]">
            <span className="shrink-0 text-[var(--amber)]">SHORTCUTS</span>
            {[["SPACE", "再生/停止"], ["3", "3Dブロック"], ["M", "マイクラへ"], ["G", "グリッド"], ["T", "タイル"], ["C", "比較"], ["R", "シード"], ["CTRL+Z", "取消"], ["CTRL+E", "書出"]].map(([k, l]) => (
              <span key={k} className="flex shrink-0 items-center gap-1">
                <kbd className="rounded-[2px] border border-[var(--line2)] bg-[#161c25] px-1 py-px text-[8.5px] text-[var(--ink2)]">{k}</kbd>{l}
              </span>
            ))}
          </div>
        </section>

        {/* 右: エフェクト */}
        <aside className={cn(
          "z-30 w-[348px] shrink-0 border-l border-[var(--line)] bg-[#0f131b]/92 backdrop-blur-md",
          "max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:h-screen max-lg:shadow-[-20px_0_60px_-30px_#000] max-lg:transition-transform",
          rightOpen ? "max-lg:translate-x-0" : "max-lg:translate-x-full max-lg:pointer-events-none",
          "hidden lg:block",
        )}>
          <EffectStack insts={insts} onChange={setInstsSafe} onRandom={randomize} focusUid={focusUid} />
        </aside>
      </main>

      {/* モバイル用オーバーレイ背景 */}
      {(leftOpen || rightOpen) && (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => { setLeftOpen(false); setRightOpen(false); }} />
      )}

      {exportOpen && (
        <ExportModal
          base={base} insts={insts} size={size} seed={seed} name={customName || texId || "texture"}
          onClose={() => setExportOpen(false)} onToast={setToast}
          onOpenPack={() => { setExportOpen(false); setMcOpen(true); }}
        />
      )}

      {mcOpen && (
        <McPackModal base={base} insts={insts} seed={seed} texId={customName ? null : texId}
          entries={packEntries} setEntries={setPackEntries}
          onClose={() => setMcOpen(false)} onToast={setToast} />
      )}

      {toast && (
        <div className="pop fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-[4px] border border-[var(--amber)]/50 bg-[#1a1610] px-4 py-2 text-[12px] text-[var(--amber)] shadow-[0_20px_50px_-20px_#000]">
          {toast}
        </div>
      )}
    </div>
  );
}

const clampN = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

// ============================================================
//  書き出しモーダル
// ============================================================
function ExportModal({ base, insts, size, seed, name, onClose, onToast, onOpenPack }: {
  base: ImageData; insts: Inst[]; size: number; seed: number; name: string;
  onClose: () => void; onToast: (m: string) => void; onOpenPack: () => void;
}) {
  const [scale, setScale] = useState("4");
  const [sheet, setSheet] = useState(false);
  const [frames, setFrames] = useState("8");
  const [loop, setLoop] = useState("2");
  const [bg, setBg] = useState("transparent");
  const preview = useRef<HTMLCanvasElement>(null);

  const sc = parseInt(scale, 10);
  const nf = sheet ? parseInt(frames, 10) : 1;
  const outW = size * sc * nf, outH = size * sc;

  useEffect(() => {
    const c = preview.current;
    if (!c) return;
    c.width = size; c.height = size;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    const tmp = document.createElement("canvas");
    tmp.width = size; tmp.height = size;
    const tg = tmp.getContext("2d")!;
    const animated = isAnimated(insts);
    const t0 = performance.now();
    let raf = 0;
    const draw = (now: number) => {
      const img = renderPipeline(base, insts, animated ? (now - t0) / 1000 : 0, seed);
      tg.clearRect(0, 0, size, size);
      tg.putImageData(img, 0, 0);
      g.clearRect(0, 0, size, size);
      if (bg !== "transparent") { g.fillStyle = bg; g.fillRect(0, 0, size, size); }
      g.drawImage(tmp, 0, 0);
      if (animated) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [base, insts, seed, size, bg]);

  const build = () => {
    const c = document.createElement("canvas");
    c.width = outW; c.height = outH;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    if (bg !== "transparent") { g.fillStyle = bg; g.fillRect(0, 0, outW, outH); }
    const loopSec = parseFloat(loop);
    for (let f = 0; f < nf; f++) {
      const img = renderPipeline(base, insts, nf > 1 ? (f / nf) * loopSec : 0, seed);
      const tmp = document.createElement("canvas");
      tmp.width = size; tmp.height = size;
      tmp.getContext("2d")!.putImageData(img, 0, 0);
      g.drawImage(tmp, f * size * sc, 0, size * sc, size * sc);
    }
    return c;
  };

  const download = () => {
    const c = build();
    c.toBlob((b) => {
      if (!b) return;
      const url = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.replace(/[^\w\-]/g, "_")}_${size}px_x${sc}${sheet ? `_${nf}f` : ""}.png`;
      a.click();
      URL.revokeObjectURL(url);
      onToast(sheet ? `${nf} フレームのシートを保存しました` : "PNG を保存しました");
    }, "image/png");
  };

  const copy = async () => {
    try {
      const c = build();
      const b = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
      if (!b) throw new Error("no blob");
      await (navigator.clipboard as any).write([new (window as any).ClipboardItem({ "image/png": b })]);
      onToast("クリップボードにコピーしました");
    } catch {
      onToast("このブラウザではコピーできません");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#070a0f]/85 backdrop-blur-[3px]" onClick={onClose} />
      <div className="reveal relative w-full max-w-2xl overflow-hidden rounded-[6px] border border-[var(--line2)] bg-[#12161f] shadow-[0_40px_120px_-40px_#000]">
        <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
          <Icon name="download" className="h-4 w-4 text-[var(--teal)]" />
          <h3 className="font-pixel text-[16px]">書き出し</h3>
          <span className="font-bit text-[9px] uppercase tracking-[0.16em] text-[var(--ink3)]">EXPORT PNG</span>
          <button onClick={onClose} className="ml-auto text-[var(--ink3)] transition-colors hover:text-[var(--ink)]">
            <Icon name="minus" className="h-4 w-4 rotate-45" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:flex-row">
          <div className="flex items-center justify-center rounded-[4px] border border-[var(--line)] bg-[#0f131a] p-4 sm:w-[200px]">
            <div className="checker rounded-[3px] p-2">
              <canvas ref={preview} className="pixelated h-[128px] w-[128px]" />
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <Select label="拡大倍率 (nearest neighbor)" value={scale} accent="#37d6c4"
              options={[["1", "×1 (原寸)"], ["2", "×2"], ["4", "×4"], ["8", "×8"], ["16", "×16"], ["32", "×32"]].map(([v, l]) => ({ v, l }))}
              onChange={setScale} />
            <Select label="背景" value={bg} accent="#37d6c4"
              options={[{ v: "transparent", l: "透明" }, { v: "#000000", l: "黒" }, { v: "#ffffff", l: "白" }, { v: "#1a202a", l: "ダークグレー" }]}
              onChange={setBg} />
            <Toggle label="アニメーションをフレームシートで出力" value={sheet} onChange={setSheet} accent="#f5a63c" />
            {sheet && (
              <div className="grid grid-cols-2 gap-3 rounded-[3px] border border-[var(--line)] bg-[#0f131a] p-2">
                <Select label="フレーム数" value={frames} accent="#f5a63c"
                  options={[{ v: "4", l: "4" }, { v: "8", l: "8" }, { v: "16", l: "16" }, { v: "24", l: "24" }]} onChange={setFrames} />
                <Select label="ループ秒数" value={loop} accent="#f5a63c"
                  options={[{ v: "1", l: "1.0 s" }, { v: "2", l: "2.0 s" }, { v: "4", l: "4.0 s" }]} onChange={setLoop} />
              </div>
            )}
            <div className="flex items-center justify-between rounded-[3px] border border-[var(--line)] bg-[#0f131a] px-3 py-2 font-bit text-[10px] uppercase tracking-[0.12em] text-[var(--ink3)]">
              <span>出力サイズ</span>
              <span className="text-[var(--amber)] tabular">{outW} × {outH} px</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] bg-[#0f131a] px-4 py-3">
          <Btn onClick={onOpenPack} accent="#b6e14f"><Icon name="box" className="h-3.5 w-3.5" />マイクラ用パックへ</Btn>
          <Btn onClick={copy}><Icon name="copy" className="h-3.5 w-3.5" />クリップボード</Btn>
          <Btn onClick={onClose}>キャンセル</Btn>
          <Btn active accent="#37d6c4" onClick={download}>
            <Icon name="download" className="h-3.5 w-3.5" />PNG を保存
          </Btn>
        </div>
      </div>
    </div>
  );
}
