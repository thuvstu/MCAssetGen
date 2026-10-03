import { TARGETS, type Target } from '../lib/exporter';
import type { CatItem } from '../lib/catalog';
import { Pix } from './Pix';

export type Entry = CatItem & { uid: number };

export function Strip({
  entries, thumbs, activeId, packName, setPackName, target, setTarget, onPick, onRemove, onAdd, onAddAll, onClear, onExport, busy, n,
}: {
  entries: Entry[];
  thumbs: Record<number, Uint8ClampedArray>;
  activeId: string;
  packName: string;
  setPackName: (v: string) => void;
  target: Target;
  setTarget: (t: Target) => void;
  onPick: (e: Entry) => void;
  onRemove: (uid: number) => void;
  onAdd: () => void;
  onAddAll: () => void;
  onClear: () => void;
  onExport: () => void;
  busy: boolean;
  n: number;
}) {
  return (
    <footer className="border-t border-white/10 bg-ink2/95 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-stretch">
        <div className="w-full shrink-0 space-y-1.5 lg:w-[250px]">
          <label className="block text-[9.5px] font-bold uppercase tracking-[0.2em] text-gold">pack name</label>
          <input value={packName} onChange={(e) => setPackName(e.target.value)} className="w-full border border-white/12 bg-ink px-2.5 py-1.5 text-[13px] text-bone outline-none focus:border-gold" />
          <select value={target} onChange={(e) => setTarget(e.target.value as Target)} className="w-full border border-white/12 bg-ink px-2 py-1.5 font-mono text-[10.5px] text-bone outline-none focus:border-gold">
            {(Object.keys(TARGETS) as Target[]).map((t) => (
              <option key={t} value={t}>{TARGETS[t].label}</option>
            ))}
          </select>
          <p className="font-mono text-[9px] leading-snug text-mist">{TARGETS[target].note}</p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-mist">pack contents · {entries.length} · {n}x</span>
            <button onClick={onClear} className="font-mono text-[9.5px] tracking-widest text-mist hover:text-[#ff5555]">CLEAR</button>
          </div>
          <div className="thin flex gap-2 overflow-x-auto pb-1">
            {entries.length === 0 &&
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="grid h-[70px] w-[60px] shrink-0 place-items-center border border-dashed border-white/14 text-[18px] text-white/18">＋</div>
              ))}
            {entries.map((e) => (
              <button
                key={e.uid}
                onClick={() => onPick(e)}
                title={`${e.en} — ${e.id}`}
                className="group relative h-[70px] w-[60px] shrink-0 border bg-white/4 hover:bg-white/8"
                style={{ borderColor: e.id === activeId ? '#ffaa00' : 'rgba(255,255,255,.12)' }}
              >
                <span className="grid h-[50px] place-items-center bg-[#8b8b8b]/20">{thumbs[e.uid] && <Pix rgba={thumbs[e.uid]} n={32} className="h-10 w-10" />}</span>
                <span className="block truncate px-1 pt-0.5 text-left font-mono text-[7.5px] text-mist">{e.id}</span>
                <span
                  className="absolute right-0 top-0 grid h-4 w-4 place-items-center bg-black/80 text-[10px] text-mist opacity-0 hover:text-[#ff5555] group-hover:opacity-100"
                  onClick={(ev) => { ev.stopPropagation(); onRemove(e.uid); }}
                >
                  ✕
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-row items-end gap-2 lg:w-[210px] lg:flex-col lg:items-stretch">
          <button onClick={onAdd} className="flex-1 border border-gold/60 px-3 py-2 text-[12px] font-bold text-gold hover:bg-gold hover:text-ink lg:flex-none">＋ 現在のアイテムを追加</button>
          <button onClick={onAddAll} className="flex-1 border border-white/16 px-3 py-2 text-[11.5px] text-mist hover:border-gold hover:text-gold lg:flex-none">カタログ全件を投入</button>
          <button onClick={onExport} disabled={busy || !entries.length} className="flex-1 bg-gold px-4 py-2.5 text-[13px] font-black text-ink hover:bg-amber disabled:cursor-not-allowed disabled:bg-slate disabled:text-mist lg:flex-none">
            {busy ? 'WRITING…' : 'ZIP 書き出し'}
          </button>
        </div>
      </div>
    </footer>
  );
}
