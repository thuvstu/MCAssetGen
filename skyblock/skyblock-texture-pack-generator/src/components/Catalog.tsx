import { useState } from 'react';
import { CATALOG, RARITIES, type CatItem } from '../lib/catalog';
import { ARCHES } from '../lib/archetypes';
import { Pix } from './Pix';

const CATS = ['すべて', '武器', '防具', '道具'] as const;

export function Catalog({
  activeId,
  thumbs,
  onPick,
}: {
  activeId: string;
  thumbs: Record<string, Uint8ClampedArray>;
  onPick: (it: CatItem) => void;
}) {
  const [cat, setCat] = useState<(typeof CATS)[number]>('すべて');
  const list = cat === 'すべて' ? CATALOG : CATALOG.filter((i) => ARCHES[i.design.arch].cat === cat);
  return (
    <div className="flex h-full min-h-0 flex-col border-r border-white/8 bg-black/40">
      <div className="flex items-baseline justify-between border-b border-white/8 px-4 py-3">
        <span className="text-[10px] font-bold tracking-[0.22em] text-gold">SKYBLOCK ITEMS</span>
        <span className="font-mono text-[10px] text-mist">{CATALOG.length} IDs</span>
      </div>
      <div className="flex gap-px border-b border-white/8 bg-white/4 p-1.5">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`flex-1 px-2 py-1 text-[11px] transition-colors ${cat === c ? 'bg-gold font-bold text-ink' : 'text-mist hover:bg-white/8 hover:text-bone'}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="thin min-h-0 flex-1 overflow-y-auto">
        {list.map((it) => {
          const r = it.rarity ? RARITIES[it.rarity] : null;
          const on = it.id === activeId;
          return (
            <button
              key={it.id}
              onClick={() => onPick(it)}
              className={`flex w-full items-center gap-3 border-b border-white/6 px-3 py-2 text-left transition-colors ${on ? 'bg-gold/12' : 'hover:bg-white/6'}`}
              style={on ? { boxShadow: 'inset 3px 0 0 #ffaa00' } : undefined}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center border border-white/10 bg-[#8b8b8b]/20">
                {thumbs[it.id] && <Pix rgba={thumbs[it.id]} n={32} className="h-8 w-8" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-bold" style={{ color: r ? r.color : '#55FF55' }}>{it.en}</span>
                <span className="block truncate font-mono text-[9px] tracking-wide text-mist">{it.id}</span>
              </span>
              {it.anim !== 'none' && <span className="shrink-0 font-mono text-[8px] tracking-widest text-amber">ANIM</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
