import React from 'react';
import { Sparkles, Maximize2, Dices, Pause, Play } from 'lucide-react';
import { cn } from '../utils/cn';
import { useForge } from '../hooks/useForge';
import { renderStaff } from '../lib/render';
import { getElement } from '../lib/catalog/elements';
import { getItemType } from '../lib/catalog/itemTypes';
import { HEAD_LABELS } from './icons';
import { MinecraftSlots, BgMode, BG_STYLES } from './Preview';
import { OrnamentFrame } from './ornaments';

/* ── animation player (RAF, ref-driven; no per-frame effect churn) ── */
function useAnimationPlayer(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const { config, anim, isAnimated } = useForge();
  const [playing, setPlaying] = React.useState(true);
  const [uiFrame, setUiFrame] = React.useState(0);
  const acc = React.useRef(0);          // fractional frame accumulator
  const scrub = React.useRef<number | null>(null);
  const total = Math.max(1, anim.frames);

  React.useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    if (!isAnimated) {
      renderStaff(config, cv);
      return;
    }
    let raf = 0, last = performance.now(), cancelled = false, lastInt = -1;
    const tick = (now: number) => {
      if (cancelled) return;
      const dt = (now - last) / 1000; last = now;
      if (scrub.current !== null) { acc.current = scrub.current; scrub.current = null; }
      else if (playing) acc.current = (acc.current + dt * anim.fps) % total;
      const frame = Math.floor(acc.current) % total;
      if (frame !== lastInt) {
        lastInt = frame;
        renderStaff(config, cv, { frame, total, t: frame / total, pingPong: anim.loopMode === 'pingpong' });
        setUiFrame(frame);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [config, isAnimated, playing, anim.fps, anim.loopMode, total, canvasRef]);

  const seek = (f: number) => { setPlaying(false); scrub.current = f; setUiFrame(f); };
  return { playing, setPlaying, frame: uiFrame, total, seek };
}

export function PreviewStage() {
  const { config, anim, isAnimated, reseed, flash } = useForge();
  const [bg, setBg] = React.useState<BgMode>('checker');
  const [zoom, setZoom] = React.useState(1);
  const [pulse, setPulse] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const player = useAnimationPlayer(canvasRef);
  const el = getElement(config.element);
  const it = getItemType(config.itemType);
  const size = Math.round(440 * zoom);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d0a1a]/80 shadow-2xl backdrop-blur">
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-1 rounded-xl bg-black/40 p-1">
          {(Object.keys(BG_STYLES) as BgMode[]).map((m) => (
            <button key={m} onClick={() => setBg(m)}
              className={cn('rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition', bg === m ? 'bg-white/12 text-amber-100 ring-1 ring-white/15' : 'text-stone-500 hover:text-stone-300')}>
              {BG_STYLES[m].label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAnimated ? (
            <div className="flex items-center gap-1 rounded-lg bg-fuchsia-500/10 px-1 py-0.5 ring-1 ring-fuchsia-400/30">
              <button onClick={() => player.setPlaying(!player.playing)} className="flex h-6 w-6 items-center justify-center rounded-md text-fuchsia-200 transition hover:bg-fuchsia-500/20">
                {player.playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </button>
              <span className="px-0.5 text-[9px] font-bold uppercase tracking-wider text-fuchsia-200">{anim.type}</span>
              <input type="range" min={0} max={player.total - 1} step={1} value={player.frame} onChange={(e) => player.seek(parseInt(e.target.value))} className="arcane-slider w-20 sm:w-28" />
              <span className="pr-1 font-mono text-[10px] text-fuchsia-300">{String(player.frame + 1).padStart(2, '0')}/{player.total}</span>
            </div>
          ) : (
            <span className="rounded-lg bg-black/40 px-2 py-1.5 text-[10px] uppercase tracking-widest text-stone-600">静止</span>
          )}
          <button onClick={() => setPulse(!pulse)} className={cn('hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition sm:flex', pulse ? 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/25' : 'bg-black/40 text-stone-500')}>
            <Sparkles className="h-3 w-3" /> 環境光
          </button>
          <div className="flex items-center gap-2 rounded-lg bg-black/40 px-2.5 py-1.5">
            <Maximize2 className="h-3 w-3 text-stone-500" />
            <input type="range" min={0.6} max={1.5} step={0.05} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="arcane-slider w-20 sm:w-28" />
            <span className="font-mono text-[11px] text-amber-200">{Math.round(zoom * 100)}%</span>
          </div>
        </div>
      </div>

      {/* stage */}
      <div className="relative border-t border-white/8">
        <OrnamentFrame />
        <div className={cn('relative flex items-center justify-center overflow-hidden transition-all duration-500', bg === 'checker' && 'checker-bg')}
          style={{ ...(BG_STYLES[bg].style || {}), minHeight: 470, margin: '10px' }}>
          {pulse && (
            <div className="pointer-events-none absolute left-1/2 top-[46%] h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[70px] transition-colors duration-700"
              style={{ background: `${config.glowColor}24` }} />
          )}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_46%,rgba(0,0,0,0.5)_100%)]" />

          <div className={cn('relative z-[5]', !isAnimated && 'animate-float')}>
            <canvas ref={canvasRef} width={config.resolution} height={config.resolution} className="pixelated"
              style={{ width: size, height: size, filter: `drop-shadow(0 12px 18px rgba(0,0,0,.55)) drop-shadow(0 0 12px ${config.glowColor}18)` }} />
          </div>

          <div className="absolute left-6 top-6 z-[6] flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" />
            <span className="font-mono text-[11px] text-stone-300">{config.resolution}×{config.resolution}</span>
            {config.refined && <span className="font-mono text-[10px] text-violet-300">SS</span>}
          </div>
          <div className="absolute right-6 top-6 z-[6] flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 backdrop-blur">
            <span className="font-mono text-[11px] text-stone-400">seed</span>
            <button onClick={() => { navigator.clipboard?.writeText(String(config.seed)); flash('シードをコピーしました'); }} className="font-mono text-[11px] font-bold text-amber-300 hover:text-amber-100">#{config.seed}</button>
            <button onClick={reseed} className="text-stone-500 transition hover:text-amber-300" title="シードだけ振り直す"><Dices className="h-3 w-3" /></button>
          </div>
          <div className="absolute bottom-6 left-1/2 z-[6] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur">
            <span className="h-2 w-2 rounded-full shadow-[0_0_6px_rgba(255,255,255,0.4)]" style={{ background: config.gemColor }} />
            <span className="font-serif text-[12px] italic text-stone-300">{el.name}・{it.name}・{HEAD_LABELS[config.headShape]}・{config.finish}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/8 bg-black/30 px-4 py-4">
        <MinecraftSlots config={config} />
      </div>
    </div>
  );
}
