import { useRef, useState } from 'react';
import type { Forged } from '../lib/engine';
import type { Metrics } from '../lib/measure';
import type { PackEssence } from '../lib/essence';
import { RARITIES, type CatItem } from '../lib/catalog';
import { ARCHES, type Design } from '../lib/archetypes';
import { toHex, type EditMap, floodFill, replaceColor, flipEditsH, flipEditsV, shiftEdits, pixelColorAt } from '../lib/edits';
import { AnimPix, Pix } from './Pix';
import { Tooltip } from './Tooltip';
import type { Target } from '../lib/exporter';

type Row = { k: string; ours: number; target: number; tol: number; fmt: (v: number) => string };
export type Tool = 'view' | 'pencil' | 'fill' | 'replace' | 'erase' | 'restore' | 'pick';

export function matchRows(m: Metrics | null, e: PackEssence): Row[] {
  if (!m) return [];
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const f2 = (v: number) => v.toFixed(2);
  return [
    { k: '色数', ours: m.colors, target: e.colors, tol: Math.max(3, e.colors * 0.35), fmt: (v) => String(Math.round(v)) },
    { k: '主材ランプ段数', ours: m.rampLen, target: e.rampLen, tol: Math.max(1.5, e.rampLen * 0.35), fmt: (v) => String(Math.round(v)) },
    { k: '明度レンジ p95−p5', ours: m.contrast, target: e.contrast, tol: 0.12, fmt: f2 },
    { k: '輪郭が内側より暗い', ours: m.darker, target: e.darker, tol: 0.18, fmt: pct },
    { k: '純黒の輪郭', ours: m.black, target: e.black, tol: 0.02, fmt: pct },
    { k: '色付き輪郭', ours: m.colored, target: e.colored, tol: 0.25, fmt: pct },
    { k: '左上光源 ΔL', ours: m.lightTL, target: e.lightDL, tol: 0.07, fmt: (v) => (v >= 0 ? '+' : '') + v.toFixed(3) },
    { k: '暖色への色相回転', ours: m.warm, target: e.warm, tol: 8, fmt: (v) => `${v.toFixed(1)}°` },
    { k: '孤立画素率', ours: m.iso, target: e.iso, tol: 0.15, fmt: pct },
    { k: '半透明ピクセル', ours: m.partial, target: e.partial, tol: 0.01, fmt: pct },
  ];
}

const Slot = ({ children, sel }: { children?: React.ReactNode; sel?: boolean }) => (
  <span
    className="relative grid h-9 w-9 place-items-center"
    style={{
      background: '#8b8b8b',
      borderTop: '2px solid #373737',
      borderLeft: '2px solid #373737',
      borderRight: '2px solid #fff',
      borderBottom: '2px solid #fff',
      outline: sel ? '2px solid #fff' : undefined,
      outlineOffset: sel ? 1 : undefined,
    }}
  >
    {children}
  </span>
);

const TOOLS: { v: Tool; t: string; key: string; hint: string }[] = [
  { v: 'view', t: '表示', key: 'V', hint: '座標と色を読む' },
  { v: 'pencil', t: '鉛筆', key: 'B', hint: 'パレットの色で塗る' },
  { v: 'fill', t: '塗りつぶし', key: 'G', hint: '同色領域をバケツ塗り' },
  { v: 'replace', t: '色置換', key: 'X', hint: 'クリックした色を一括置換' },
  { v: 'erase', t: '透過', key: 'E', hint: '透明にして削る' },
  { v: 'restore', t: '復元', key: 'R', hint: '生成時のピクセルに戻す' },
  { v: 'pick', t: 'スポイト', key: 'I', hint: 'キャンバスから色を拾う' },
];

export function Stage(props: {
  fg: Forged;
  n: number;
  work: CatItem;
  metrics: Metrics | null;
  pack: PackEssence;
  thumbs: Uint8ClampedArray[];
  pulls: Uint8ClampedArray[] | null;
  variants: { design: Design; rgba: Uint8ClampedArray }[];
  palette: number[];
  tool: Tool;
  setTool: (t: Tool) => void;
  color: number;
  setColor: (c: number) => void;
  edits: EditMap;
  editCount: number;
  brushSize: number;
  setBrushSize: (v: number) => void;
  fillTolerance: number;
  setFillTolerance: (v: number) => void;
  canUndo: boolean;
  onStroke: () => void;
  onPaint: (i: number) => void;
  onApplyEditMap: (map: EditMap) => void;
  onUndo: () => void;
  onClearEdits: () => void;
  onPickVariant: (d: Design) => void;
  onReroll: () => void;
  onAdd: () => void;
  onSave: () => void;
  onNew: () => void;
  onRandom: () => void;
  target: Target;
  modernCommand: string;
  onCopyCommand: (cmd: string) => void;
}) {
  const {
    fg, n, work, metrics, pack, thumbs, pulls, variants, palette, tool, setTool, color, setColor, edits,
    brushSize, setBrushSize, fillTolerance, setFillTolerance,
  } = props;
  const [grid, setGrid] = useState(true);
  const [bg, setBg] = useState<'checker' | 'dark' | 'slot' | 'obsidian'>('checker');
  const [mirrorX, setMirrorX] = useState(false);
  const [hover, setHover] = useState<{ x: number; y: number; c: string } | null>(null);
  const frameRef = useRef(0);
  const drawing = useRef(false);
  const lastPx = useRef(-1);
  const [frame, setFrame] = useState(0);
  const rows = matchRows(metrics, pack);
  const score = rows.filter((r) => Math.abs(r.ours - r.target) <= r.tol).length;
  const r = work.rarity ? RARITIES[work.rarity] : null;
  const A = ARCHES[work.design.arch];

  const giveCommand = props.target === 'vanilla'
    ? props.modernCommand
    : props.target === 'optifine'
      ? `/give @p minecraft:${work.base}{ExtraAttributes:{id:"${work.id}"}} 1`
      : `/give @s minecraft:${work.base}[minecraft:custom_data={ExtraAttributes:{id:"${work.id}"}}] 1`;
  const commandLabel = props.target === 'vanilla' ? 'FUNCTION コマンドをコピー' : props.target === 'optifine' ? '1.8.9 NBT例をコピー' : 'custom_data例をコピー';

  const tip = [
    work.rarity ? `${r!.code}${work.en}` : `§a${work.en} §7(Click)`,
    `§8${work.id}`,
    '',
    `§7Resolution: §a${n}×${n} native`,
    `§7Palette: §a${fg.palette} colors`,
    fg.frames.length > 1 ? `§7Animation: §a${fg.frames.length} frames §8· frametime ${fg.frametime}` : '§7Animation: §8static',
    ...(pulls ? ['§7Draw states: §a4 §8(standby + pulling 0–2)'] : []),
    ...(props.editCount ? [`§7Hand-edited: §e${props.editCount} px`] : []),
    `§7Essence Match: §a${score}/10 §8(${pack.name})`,
    '',
    `§6Ability: Forged Texture §e§lRIGHT CLICK`,
    `§7Built from ${A.en.toLowerCase()} parts in 64-space,`,
    `§7quantised to measured pack ramps.`,
    '',
    ...(A.handheld && work.rarity ? ['§8This item can be reforged!'] : []),
    ...(work.rarity ? [`${r!.code}§l${r!.en}${work.type ? ' ' + work.type : ''}`] : []),
  ];

  const pxAt = (ev: React.PointerEvent<HTMLDivElement>) => {
    const rect = ev.currentTarget.getBoundingClientRect();
    const x = Math.floor(((ev.clientX - rect.left) / rect.width) * n);
    const y = Math.floor(((ev.clientY - rect.top) / rect.height) * n);
    return x < 0 || y < 0 || x >= n || y >= n ? null : { x, y };
  };

  const act = (x: number, y: number) => {
    const i = y * n + x;
    if (tool === 'pick') {
      const d = fg.frames[0];
      if (d[i * 4 + 3]) {
        setColor(((d[i * 4] << 24) | (d[i * 4 + 1] << 16) | (d[i * 4 + 2] << 8) | 255) >>> 0);
        setTool('pencil');
      }
      return;
    }
    if (tool === 'fill') {
      props.onStroke();
      const nextMap = floodFill(fg.frames[0], n, i, color, edits, fillTolerance);
      props.onApplyEditMap(nextMap);
      return;
    }
    if (tool === 'replace') {
      props.onStroke();
      const oldColor = pixelColorAt(fg.frames[0], i, edits);
      const nextMap = replaceColor(fg.frames[0], n, oldColor, color, edits, fillTolerance);
      props.onApplyEditMap(nextMap);
      return;
    }
    if (i === lastPx.current) return;
    lastPx.current = i;
    props.onPaint(i);
    if (mirrorX) {
      const mx = n - 1 - x;
      if (mx !== x) props.onPaint(y * n + mx);
    }
  };

  const onDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (tool === 'view') return;
    const p = pxAt(ev);
    if (!p) return;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    drawing.current = true;
    lastPx.current = -1;
    if (tool === 'pencil' || tool === 'erase' || tool === 'restore') props.onStroke();
    act(p.x, p.y);
  };

  const onMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    const p = pxAt(ev);
    if (!p) return setHover(null);
    const d = fg.frames[frameRef.current] ?? fg.frames[0];
    const i = (p.y * n + p.x) * 4;
    setHover({
      x: p.x,
      y: p.y,
      c: d[i + 3] ? '#' + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('') : 'transparent',
    });
    if (drawing.current && (tool === 'pencil' || tool === 'erase' || tool === 'restore')) act(p.x, p.y);
  };

  const onUp = () => {
    drawing.current = false;
    lastPx.current = -1;
  };

  const bgStyle =
    bg === 'dark' ? { background: '#15131c' } :
    bg === 'slot' ? { background: '#8b8b8b' } :
    bg === 'obsidian' ? { background: '#08060f' } : undefined;

  const cursor = tool === 'view' ? 'crosshair' : tool === 'pick' ? 'copy' : 'cell';

  return (
    <div className="thin h-full overflow-y-auto px-5 py-5 lg:px-7">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/8 pb-4">
        <div className="min-w-0">
          <div className="font-mono text-[10px] tracking-[0.25em] text-gold">{work.id}</div>
          <h2 className="truncate font-display text-[clamp(26px,3.2vw,42px)] leading-[1.05]" style={{ color: r ? r.color : '#55FF55' }}>
            {work.en}
          </h2>
          <div className="mt-1 text-[12px] text-mist">
            {work.jp} · {A.jp}（{A.A[work.design.a]} / {A.B[work.design.b]}）
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] tracking-[0.2em] text-mist">ESSENCE MATCH vs {pack.name}</div>
          <div
            className="font-display text-[34px] leading-none"
            style={{ color: score >= 9 ? '#55FF55' : score >= 7 ? '#FFFF55' : '#FF5555' }}
          >
            {score}<span className="text-[18px] text-mist">/10</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-6 2xl:flex-row 2xl:items-start">
        <div className="w-full max-w-[540px] shrink-0">
          {/* ---- touch-up toolbar ---- */}
          <div className="mb-2 flex flex-wrap items-center gap-1">
            {TOOLS.map((t) => (
              <button
                key={t.v}
                title={`${t.hint}（${t.key}）`}
                onClick={() => setTool(t.v)}
                className={`border px-2.5 py-1.5 text-[11px] transition-colors ${
                  tool === t.v ? 'border-gold bg-gold font-bold text-ink' : 'border-white/14 text-mist hover:border-gold/60 hover:text-bone'
                }`}
              >
                {t.t}<span className="ml-1 font-mono text-[8.5px] opacity-60">{t.key}</span>
              </button>
            ))}
            <button
              onClick={() => setMirrorX((m) => !m)}
              className={`border px-2 py-1.5 text-[10.5px] transition-colors ${mirrorX ? 'border-gold bg-gold/20 text-gold' : 'border-white/14 text-mist'}`}
              title="左右対称描画モード"
            >
              左右対称 {mirrorX ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={props.onUndo}
              disabled={!props.canUndo}
              title="元に戻す（Ctrl+Z）"
              className="ml-auto border border-white/14 px-2 py-1.5 text-[11px] text-mist hover:text-bone disabled:opacity-30"
            >
              ↶ 戻す
            </button>
            <button
              onClick={props.onClearEdits}
              disabled={!props.editCount}
              className="border border-white/14 px-2 py-1.5 text-[11px] text-mist hover:text-[#ff5555] disabled:opacity-30"
            >
              全消去
            </button>
          </div>

          {/* Palette & Pixel Shift Controls */}
          {tool !== 'view' && (
            <div className="mb-2 border border-white/10 bg-black/45 p-2">
              <div className="mb-1.5 flex items-baseline justify-between font-mono text-[9.5px] text-mist">
                <span>生成パレット {palette.length} 色 · ピクセル手直しレイヤー</span>
                <span className="flex items-center gap-1.5 text-bone">
                  <span className="inline-block h-3 w-3 border border-white/40" style={{ background: toHex(color) }} />
                  {toHex(color)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {palette.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setColor(c); if (tool !== 'pencil' && tool !== 'fill' && tool !== 'replace') setTool('pencil'); }}
                    title={toHex(c)}
                    className="h-6 w-6 border transition-transform hover:scale-110"
                    style={{
                      background: toHex(c),
                      borderColor: c === color ? '#ffaa00' : 'rgba(0,0,0,.6)',
                      boxShadow: c === color ? '0 0 0 1.5px #ffaa00' : undefined,
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/8 pt-1.5 font-mono text-[9.5px]">
                <span className="text-mist">筆幅</span>
                {[1, 2, 3, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setBrushSize(s)}
                    title={`${s} px brush`}
                    className={`h-5 w-5 border transition-colors ${brushSize === s ? 'border-gold bg-gold/25 text-gold' : 'border-white/12 text-mist hover:text-bone'}`}
                  >
                    {s}
                  </button>
                ))}
                <span className="ml-2 text-mist">塗り誤差</span>
                <input
                  type="range"
                  className="fx w-[86px]"
                  min={0}
                  max={1}
                  step={0.02}
                  value={fillTolerance}
                  onChange={(e) => setFillTolerance(parseFloat(e.target.value))}
                  style={{ ['--p' as string]: `${fillTolerance * 100}%` }}
                />
                <span className="text-bone tabular-nums">{Math.round(fillTolerance * 100)}%</span>
                <span className="ml-auto text-[9px] text-mist/70">[ / ] で筆幅</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1 font-mono text-[9.5px]">
                <span className="text-mist mr-1">手直し反転/移動:</span>
                <button onClick={() => { props.onStroke(); props.onApplyEditMap(flipEditsH(edits, n)); }} className="border border-white/12 px-1.5 py-0.5 text-mist hover:text-bone">↔ 左右反転</button>
                <button onClick={() => { props.onStroke(); props.onApplyEditMap(flipEditsV(edits, n)); }} className="border border-white/12 px-1.5 py-0.5 text-mist hover:text-bone">↕ 上下反転</button>
                <button onClick={() => { props.onStroke(); props.onApplyEditMap(shiftEdits(edits, n, -1, 0)); }} className="border border-white/12 px-1.5 py-0.5 text-mist hover:text-bone">← 1px</button>
                <button onClick={() => { props.onStroke(); props.onApplyEditMap(shiftEdits(edits, n, 1, 0)); }} className="border border-white/12 px-1.5 py-0.5 text-mist hover:text-bone">→ 1px</button>
                <button onClick={() => { props.onStroke(); props.onApplyEditMap(shiftEdits(edits, n, 0, -1)); }} className="border border-white/12 px-1.5 py-0.5 text-mist hover:text-bone">↑ 1px</button>
                <button onClick={() => { props.onStroke(); props.onApplyEditMap(shiftEdits(edits, n, 0, 1)); }} className="border border-white/12 px-1.5 py-0.5 text-mist hover:text-bone">↓ 1px</button>
              </div>
            </div>
          )}

          {/* Canvas Stage */}
          <div
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerLeave={() => { setHover(null); }}
            className={`relative aspect-square w-full touch-none select-none border shadow-[0_40px_70px_-30px_rgba(0,0,0,0.95)] ${
              bg === 'checker' ? 'checker' : ''
            } ${fg.bounds.clipped ? 'border-[#ff5555]' : tool !== 'view' ? 'border-gold/60' : 'border-white/12'}`}
            style={{ ...bgStyle, cursor }}
          >
            <AnimPix
              frames={tool === 'view' ? fg.frames : [fg.frames[0]]}
              n={n}
              frametime={fg.frametime}
              className="absolute inset-0 h-full w-full"
              onFrame={(f) => {
                frameRef.current = f;
                if (fg.frames.length > 1 && tool === 'view') setFrame(f);
              }}
            />
            {grid && <div className="pixelgrid pointer-events-none absolute inset-0" style={{ backgroundSize: `${100 / n}% ${100 / n}%` }} />}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-2 font-mono text-[9.5px] tracking-widest">
              <span className="bg-black/75 px-1.5 py-0.5 text-white/85">
                {n} × {n} · NATIVE{props.editCount ? ` · ${props.editCount}px 手直し` : ''}
              </span>
              <span className="bg-black/75 px-1.5 py-0.5 text-gold">
                {tool !== 'view' ? 'EDIT · FRAME 1' : fg.frames.length > 1 ? `FRAME ${frame + 1}/${fg.frames.length}` : 'STATIC'}
              </span>
            </div>
            {fg.bounds.clipped && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#ff5555]/70 bg-black/85 px-3 py-2 text-center font-mono text-[10px] text-[#ff7777]">
                CLIPPED · 自動フィットをONにするか位置/倍率を戻してください
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between p-2 font-mono text-[9.5px] tracking-widest">
              <span className="bg-black/75 px-1.5 py-0.5 text-white/85">
                {hover ? `x:${String(hover.x).padStart(2, '0')} y:${String(hover.y).padStart(2, '0')}` : 'x:-- y:--'}
              </span>
              <span className="flex items-center gap-1.5 bg-black/75 px-1.5 py-0.5 text-white/85">
                {hover && hover.c !== 'transparent' && <span className="inline-block h-2.5 w-2.5 border border-white/40" style={{ background: hover.c }} />}
                {hover ? hover.c : '#------'}
              </span>
            </div>
          </div>

          <div className={`mt-1 font-mono text-[9px] ${fg.bounds.clipped ? 'text-[#ff7777]' : 'text-mist'}`}>
            bounds x{fg.bounds.x} y{fg.bounds.y} · {fg.bounds.w}×{fg.bounds.h} px · safe margin {fg.bounds.clipped ? 'BREACHED' : 'OK'}
          </div>

          {/* Action buttons */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={props.onAdd} className="bg-gold px-4 py-2.5 text-[12.5px] font-black text-ink hover:bg-amber">
              ＋ パックに追加
            </button>
            <button onClick={props.onSave} className="border border-white/18 px-3 py-2.5 text-[12.5px] text-mist hover:border-gold hover:text-gold">
              PNG 保存
            </button>
            <button onClick={props.onNew} className="border border-white/18 px-3 py-2.5 text-[12.5px] text-mist hover:border-gold hover:text-gold">
              新デザイン
            </button>
            <button onClick={props.onRandom} className="border border-white/18 px-3 py-2.5 text-[12.5px] text-mist hover:border-gold hover:text-gold">
              完全ランダム
            </button>
            <div className="ml-auto flex gap-1">
              <button onClick={() => setGrid((g) => !g)} className={`border px-2.5 py-2 font-mono text-[10px] tracking-widest ${grid ? 'border-gold/70 text-gold' : 'border-white/18 text-mist'}`}>
                GRID
              </button>
              {(['checker', 'dark', 'slot', 'obsidian'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBg(b)}
                  className={`border px-2.5 py-2 font-mono text-[10px] tracking-widest ${bg === b ? 'border-gold/70 text-gold' : 'border-white/18 text-mist'}`}
                >
                  {b === 'checker' ? '透過' : b === 'dark' ? '暗' : b === 'slot' ? '枠' : '虚空'}
                </button>
              ))}
            </div>
          </div>

          {/* Command Copy Pill */}
          <div className="mt-3 flex items-center justify-between gap-2 border border-white/10 bg-black/40 px-3 py-2 font-mono text-[10.5px]">
            <span className="truncate text-mist">{giveCommand}</span>
            <button
              onClick={() => props.onCopyCommand(giveCommand)}
              className="shrink-0 border border-gold/50 px-2 py-1 text-[9.5px] font-bold text-gold hover:bg-gold hover:text-ink"
            >
              {commandLabel}
            </button>
          </div>

          {/* Bow Draw States Preview */}
          {pulls && (
            <div className="mt-4 border border-white/10 bg-black/40 p-3">
              <div className="mb-2 flex items-baseline justify-between font-mono text-[9.5px] uppercase tracking-[0.22em]">
                <span className="text-gold">bow draw states — 引き絵 4 状態</span>
                <span className="text-mist">using_item → use_duration 0.65 / 0.9</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[fg.frames[0], ...pulls].map((f, k) => (
                  <div key={k} className="text-center">
                    <div className="checker grid aspect-square place-items-center border border-white/10">
                      <Pix rgba={f} n={n} className="h-[88%] w-[88%]" />
                    </div>
                    <div className="mt-1 font-mono text-[9px] text-mist">{k === 0 ? 'standby' : `pulling_${k - 1}`}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In-game GUI Simulation */}
          <div className="mt-4">
            <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.24em] text-mist">
              in-game · hotbar & container (GUI ×2)
            </div>
            <div className="inline-block border-2 border-[#555] bg-[#c6c6c6] p-2 shadow-[inset_2px_2px_0_#fff,inset_-2px_-2px_0_#555]">
              <div className="mb-1.5 font-display text-[13px] text-[#404040]">Forged Pack</div>
              <div className="grid grid-cols-9 gap-0">
                {Array.from({ length: 27 }).map((_, i) => (
                  <Slot key={i}>{thumbs[i] && <Pix rgba={thumbs[i]} n={32} className="h-8 w-8" />}</Slot>
                ))}
              </div>
            </div>
            <div className="mt-2 flex gap-0 border-2 border-[#1b1b1b] bg-[#1b1b1b]/60 p-0.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <Slot key={i} sel={i === 0}>
                  {i === 0 ? <AnimPix frames={fg.frames} n={n} frametime={fg.frametime} className="h-8 w-8" /> : thumbs[i - 1] && <Pix rgba={thumbs[i - 1]} n={32} className="h-8 w-8" />}
                </Slot>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Variations, Essence Match, Tooltip */}
        <div className="w-full min-w-0 flex-1 space-y-4">
          <div className="border border-white/10 bg-black/45 p-3">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold">variations — 同じ素材で {variants.length} 案</span>
              <button onClick={props.onReroll} className="border border-gold/60 px-2 py-1 text-[10.5px] font-bold text-gold hover:bg-gold hover:text-ink">
                再生成
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {variants.map((v, i) => (
                <button
                  key={i}
                  onClick={() => props.onPickVariant(v.design)}
                  title={`${A.A[v.design.a]} / ${A.B[v.design.b]}`}
                  className="group grid aspect-square place-items-center border border-white/10 bg-[#8b8b8b]/15 transition-colors hover:border-gold hover:bg-gold/10"
                >
                  <Pix rgba={v.rgba} n={32} className="h-[86%] w-[86%] transition-transform group-hover:scale-110" />
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-mist">
              クリックで採用。形態A/B・長さ・幅・装飾・宝石・霊紋を振り直した案です（素材と様式はそのまま）。
            </p>
          </div>

          <div className="border border-white/10 bg-black/45 p-3">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold">essence match — same analyser as the real packs</span>
              <span className="font-mono text-[9px] text-mist">{pack.icons.toLocaleString()} icons</span>
            </div>
            <div className="space-y-1">
              {rows.map((row) => {
                const ok = Math.abs(row.ours - row.target) <= row.tol;
                return (
                  <div key={row.k} className="grid grid-cols-[1fr_auto_auto_16px] items-center gap-2 border-b border-white/5 pb-1 font-mono text-[10.5px]">
                    <span className="truncate text-mist">{row.k}</span>
                    <span className="tabular-nums text-bone">{row.fmt(row.ours)}</span>
                    <span className="tabular-nums text-mist/70">/ {row.fmt(row.target)}</span>
                    <span style={{ color: ok ? '#55FF55' : '#FFFF55' }}>{ok ? '✓' : '△'}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-mist">
              右列は {pack.name}（{pack.version}）の全アイコンの中央値。手直し後の絵も同じ計測器でリアルタイム再採点されます。
            </p>
          </div>

          <div>
            <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-mist">tooltip · vanilla geometry</div>
            <Tooltip lines={tip} />
          </div>
        </div>
      </div>
    </div>
  );
}
