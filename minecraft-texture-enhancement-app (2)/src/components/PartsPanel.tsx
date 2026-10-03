import { useMemo, useState } from 'react';
import { Tex, texToDataURL } from '../lib/tex';
import { PARTS, PART_CATEGORIES, PartCategory, PartDef, stampPart } from '../lib/parts';
import { Layer, newLayer } from '../lib/effects';

export default function PartsPanel({ base, onAdd }: {
  base: Tex;
  onAdd: (layer: Layer, label: string) => void;
}) {
  const [cat, setCat] = useState<PartCategory | 'all'>('all');
  const list = cat === 'all' ? PARTS : PARTS.filter((p) => p.category === cat);

  const thumbs = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of list) m[p.id] = texToDataURL(stampPart(base, p, p.category === 'aura' || p.category === 'flame' || p.category === 'wing' ? 'over' : 'over', 100));
    return m;
  }, [base, list]);

  const add = (p: PartDef) => {
    const blend = (p.category === 'aura' || p.category === 'flame') ? 'add' : p.category === 'wing' ? 'under' : 'over';
    onAdd(newLayer('partstamp', { part: p.id, blend, amount: 100 }), `パーツ「${p.name}」を追加`);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-1">
        <button className={`tab ${cat === 'all' ? 'tab-on' : ''}`} onClick={() => setCat('all')}>全て</button>
        {PART_CATEGORIES.map((c) => (
          <button key={c.id} className={`tab ${cat === c.id ? 'tab-on' : ''}`} onClick={() => setCat(c.id)}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-zinc-400">クリックでレイヤーに重ねます。刃・鍔・宝石・翼・オーラなど。</p>
      <div className="grid grid-cols-2 gap-1.5">
        {list.map((p) => (
          <button key={p.id} className="mc-slot text-left" onClick={() => add(p)}>
            <div className="flex items-center gap-1">
              <span>{p.icon}</span>
              <span className="text-[11px] font-bold truncate">{p.name}</span>
            </div>
            <img src={thumbs[p.id]} alt="" className="w-full mt-1" style={{ imageRendering: 'pixelated' }} />
          </button>
        ))}
      </div>
    </div>
  );
}
