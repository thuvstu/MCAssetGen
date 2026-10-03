import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronsDown, ChevronsUp, Eye, EyeOff,
  Gem, Layers, Move, RotateCcw, Trash2,
} from 'lucide-react';
import { DECORATIONS, type Decoration } from '../lib/forms';
import type { DecorLayer, ShapeOptions } from '../lib/design';
import {
  BODY, addDecoration, buildStack, layerOf, moveInStack, removeDecoration, resetTweak,
  setLayer, tweakOf, updateTweak, type StackMove,
} from '../lib/layers';
import { EssenceSlider } from './controls';

type SetShape = (update: (current: ShapeOptions) => ShapeOptions) => void;

const decoName = (id: Decoration) => DECORATIONS.find((d) => d.id === id)?.jp ?? id;
const OFFSET_LIMIT = 28;
const clampOffset = (v: number) => Math.max(-OFFSET_LIMIT, Math.min(OFFSET_LIMIT, Math.round(v)));

/** X/Y pixel offset editor with nudge buttons; shift-click nudges by 4px. */
function OffsetPad({ x, y, onChange, accent }: { x: number; y: number; onChange: (x: number, y: number) => void; accent: string }) {
  const nudge = (dx: number, dy: number) => (e: React.MouseEvent) => {
    const k = e.shiftKey ? 4 : 1;
    onChange(clampOffset(x + dx * k), clampOffset(y + dy * k));
  };
  const btn = 'flex h-6 w-6 items-center justify-center rounded bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white';
  return (
    <div className="flex items-center gap-3">
      <div className="grid grid-cols-3 gap-0.5">
        <span /><button className={btn} onClick={nudge(0, -1)} title="上へ (Shiftで4px)"><ArrowUp className="h-3 w-3" /></button><span />
        <button className={btn} onClick={nudge(-1, 0)} title="左へ"><ArrowLeft className="h-3 w-3" /></button>
        <button className={`${btn} text-[9px] font-black`} onClick={() => onChange(0, 0)} title="0,0へ戻す">0</button>
        <button className={btn} onClick={nudge(1, 0)} title="右へ"><ArrowRight className="h-3 w-3" /></button>
        <span /><button className={btn} onClick={nudge(0, 1)} title="下へ"><ArrowDown className="h-3 w-3" /></button><span />
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2">
        {([['X', x, (v: number) => onChange(clampOffset(v), y)], ['Y', y, (v: number) => onChange(x, clampOffset(v))]] as const).map(([axis, value, set]) => (
          <label key={axis} className="text-[9px] font-bold text-slate-500">
            {axis}
            <input type="number" min={-OFFSET_LIMIT} max={OFFSET_LIMIT} value={value} onChange={(e) => set(Number(e.target.value))}
              className="mt-0.5 w-full rounded bg-black/50 px-1.5 py-1 font-mono text-[11px] outline-none" style={{ color: accent }} />
          </label>
        ))}
      </div>
    </div>
  );
}

export function DecorationPanel({
  shape, setShape, selected, onSelect, onFocusCanvasTool,
}: {
  shape: ShapeOptions;
  setShape: SetShape;
  selected: Decoration | null;
  onSelect: (id: Decoration | null) => void;
  onFocusCanvasTool: () => void;
}) {
  const stack = buildStack(shape);
  const topDown = [...stack].reverse();
  const sel = selected && shape.decorations.includes(selected) ? selected : null;
  const selTweak = sel ? tweakOf(shape, sel) : null;

  const toggle = (id: Decoration) => {
    if (shape.decorations.includes(id)) {
      setShape((c) => removeDecoration(c, id));
      if (sel === id) onSelect(null);
    } else {
      setShape((c) => addDecoration(c, id));
      onSelect(id);
    }
  };
  const move = (id: Decoration, m: StackMove) => setShape((c) => moveInStack(c, id, m));
  const flip = (id: Decoration) => setShape((c) => setLayer(c, id, layerOf(c, id) === 'front' ? 'back' : 'front'));

  return (
    <div className="rounded-2xl border border-rose-300/25 bg-[#0e1328]/90 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[13px] font-black text-white"><Gem className="h-4 w-4 text-rose-300" /> 特殊装飾 DECOR</p>
        <span className="font-mono text-[10px] text-slate-500">{shape.decorations.length} / {DECORATIONS.length}</span>
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
        本体の形を解析して沿わせ、本体の変形にも追従します。位置は<b className="text-slate-300">本体アンカーからのピクセル距離</b>で、装飾を動かしても本体の位置・サイズは変わりません。
      </p>

      {/* ---------- global ---------- */}
      <div className="mt-3 space-y-3 rounded-xl bg-black/25 p-2.5">
        <div className="grid grid-cols-2 gap-3">
          <EssenceSlider label="SIZE" jp="装飾サイズ" value={shape.decorationScale} max={1.8} onChange={(v) => setShape((c) => ({ ...c, decorationScale: Math.max(0.4, v) }))} />
          <EssenceSlider label="SPREAD" jp="外周展開" value={shape.decorationSpread} max={1.8} onChange={(v) => setShape((c) => ({ ...c, decorationSpread: Math.max(0.4, v) }))} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400">装飾だけ移動（全装飾）</span>
            <button onClick={onFocusCanvasTool} className="flex items-center gap-1 rounded bg-rose-300/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-200 hover:bg-rose-300/20"><Move className="h-3 w-3" /> キャンバスでドラッグ</button>
          </div>
          <OffsetPad accent="#fda4af" x={shape.decorOffsetX} y={shape.decorOffsetY} onChange={(x, y) => setShape((c) => ({ ...c, decorOffsetX: x, decorOffsetY: y }))} />
        </div>
        <div className="flex items-center gap-1 text-[9px]">
          <span className="mr-1 font-bold text-slate-500">フィット対象</span>
          {([['all', '本体＋装飾'], ['body', '本体のみ']] as const).map(([scope, label]) => (
            <button key={scope} onClick={() => setShape((c) => ({ ...c, fitScope: scope }))}
              className={`flex-1 rounded py-1 font-bold ${shape.fitScope === scope ? 'bg-rose-300/15 text-rose-100' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`}>{label}</button>
          ))}
        </div>
        <p className="text-[9px] leading-relaxed text-slate-600">「本体のみ」は本体を最大サイズに保ち、はみ出た装飾を安全余白で切り取ります。</p>
      </div>

      {/* ---------- catalog ---------- */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {DECORATIONS.map((d) => {
          const on = shape.decorations.includes(d.id);
          return (
            <button key={d.id} onClick={() => toggle(d.id)}
              className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold transition-colors ${on ? 'border-rose-300/70 bg-rose-300/15 text-rose-100' : 'border-white/10 bg-black/25 text-slate-400 hover:border-white/25 hover:text-slate-100'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-rose-300' : 'bg-slate-600'}`} />
              {d.jp}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        <button onClick={() => setShape((c) => DECORATIONS.reduce((acc, d) => addDecoration(acc, d.id), c))} className="flex-1 rounded-lg bg-white/5 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-white/10">全部盛り</button>
        <button onClick={() => { setShape((c) => ({ ...c, decorations: [], decorTweaks: {} })); onSelect(null); }} className="flex-1 rounded-lg bg-white/5 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-white/10">全解除</button>
        <button onClick={() => setShape((c) => ({ ...c, decorations: DECORATIONS.filter(() => Math.random() > 0.72).map((d) => d.id), decorTweaks: {} }))} className="flex-1 rounded-lg bg-white/5 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-white/10">ランダム</button>
      </div>

      {/* ---------- layer stack ---------- */}
      {shape.decorations.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-500"><Layers className="h-3 w-3" /> LAYERS（上ほど手前）</p>
          <div className="space-y-1">
            {topDown.map((entry) => {
              if (entry.id === BODY) {
                return <div key="body" className="flex items-center gap-2 rounded-lg border border-dashed border-amber-300/30 bg-amber-300/5 px-2 py-1.5 text-[10px] font-black text-amber-200">◆ 本体 BODY <span className="ml-auto font-mono text-[9px] font-normal text-amber-200/60">ANCHOR</span></div>;
              }
              const id = entry.id;
              const t = tweakOf(shape, id);
              const active = sel === id;
              const moved = t.x !== 0 || t.y !== 0 || t.scale !== 1 || t.spread !== 1;
              return (
                <div key={id} onClick={() => onSelect(active ? null : id)}
                  className={`group flex cursor-pointer items-center gap-1 rounded-lg border px-1.5 py-1 ${active ? 'border-rose-300/60 bg-rose-300/10' : 'border-white/5 bg-black/25 hover:border-white/15'}`}>
                  <button onClick={(e) => { e.stopPropagation(); setShape((c) => updateTweak(c, id, { hidden: !t.hidden })); }} title={t.hidden ? '表示' : '非表示'} className="rounded p-1 text-slate-500 hover:text-white">
                    {t.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                  <span className={`min-w-0 flex-1 truncate text-[10px] font-bold ${t.hidden ? 'text-slate-600 line-through' : 'text-slate-200'}`}>{decoName(id)}{moved && <span className="ml-1 text-rose-300">•</span>}</span>
                  <button onClick={(e) => { e.stopPropagation(); flip(id); }} title="前面/背面を切替"
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${entry.layer === 'front' ? 'bg-cyan-300/15 text-cyan-200' : 'bg-violet-300/15 text-violet-200'}`}>{entry.layer === 'front' ? '前' : '背'}</button>
                  {([['top', ChevronsUp, '最前面へ'], ['up', ArrowUp, '1つ手前へ'], ['down', ArrowDown, '1つ奥へ'], ['bottom', ChevronsDown, '最背面へ']] as const).map(([m, Icon, label]) => (
                    <button key={m} onClick={(e) => { e.stopPropagation(); move(id, m); }} title={label} className="rounded p-0.5 text-slate-600 hover:bg-white/10 hover:text-white"><Icon className="h-3 w-3" /></button>
                  ))}
                  <button onClick={(e) => { e.stopPropagation(); toggle(id); }} title="削除" className="rounded p-0.5 text-slate-700 hover:bg-red-400/10 hover:text-red-300"><Trash2 className="h-3 w-3" /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------- per-decoration inspector ---------- */}
      {sel && selTweak && (
        <div className="mt-3 space-y-3 rounded-xl border border-rose-300/30 bg-rose-300/[0.04] p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-rose-100">{decoName(sel)} だけを調整</span>
            <div className="flex gap-1">
              {(['back', 'front'] as DecorLayer[]).map((layer) => (
                <button key={layer} onClick={() => setShape((c) => setLayer(c, sel, layer))}
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${layerOf(shape, sel) === layer ? 'bg-rose-300/20 text-rose-100' : 'bg-white/5 text-slate-500'}`}>{layer === 'front' ? '表に出す' : '後ろに下げる'}</button>
              ))}
              <button onClick={() => setShape((c) => resetTweak(c, sel))} title="この装飾の調整をリセット" className="rounded bg-white/5 p-1 text-slate-500 hover:text-white"><RotateCcw className="h-3 w-3" /></button>
            </div>
          </div>
          <OffsetPad accent="#fecdd3" x={selTweak.x} y={selTweak.y} onChange={(x, y) => setShape((c) => updateTweak(c, sel, { x, y }))} />
          <div className="grid grid-cols-2 gap-3">
            <EssenceSlider label="SIZE" jp="個別サイズ" value={selTweak.scale} max={2} onChange={(v) => setShape((c) => updateTweak(c, sel, { scale: Math.max(0.35, v) }))} />
            <EssenceSlider label="SPREAD" jp="個別展開" value={selTweak.spread} max={2} onChange={(v) => setShape((c) => updateTweak(c, sel, { spread: Math.max(0.35, v) }))} />
          </div>
          <p className="text-[9px] text-slate-600">個別値は全体値に掛け合わされます。キャンバスの装飾移動ツールも、選択中はこの装飾だけを動かします。</p>
        </div>
      )}
    </div>
  );
}
