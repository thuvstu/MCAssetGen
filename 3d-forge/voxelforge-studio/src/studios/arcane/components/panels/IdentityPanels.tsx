import { Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useForge } from '../../hooks/useForge';
import { ELEMENTS, getElement } from '../../lib/catalog/elements';
import { ITEM_TYPES, getItemType } from '../../lib/catalog/itemTypes';
import { MOD_ESSENCES, getModEssence } from '../../lib/catalog/modEssences';
import { GENERIC_ICONS } from '../icons';
import { LockPin } from '../controls';
import { OrnamentDivider } from '../ornaments';

function PanelHead({ title, tag, tone, lock }: { title: string; tag: string; tone: 'violet' | 'amber' | 'emerald'; lock?: React.ReactNode }) {
  const toneCls = { violet: 'text-violet-100', amber: 'text-amber-100', emerald: 'text-emerald-100' }[tone];
  const tagCls = { violet: 'text-violet-300', amber: 'text-amber-300', emerald: 'text-emerald-300' }[tone];
  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h2 className={cn('flex items-center gap-2 font-display text-[13px] font-bold uppercase tracking-[0.18em]', toneCls)}>
          {title} {lock}
        </h2>
        <span className={cn('rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-medium', tagCls)}>{tag}</span>
      </div>
      <OrnamentDivider className="mb-3 opacity-40" />
    </>
  );
}

export function ElementPanel() {
  const { config, applyElementId } = useForge();
  const el = getElement(config.element);
  return (
    <div className="panel-luxe p-4">
      <PanelHead title="属性 / Element" tag={el.nameEn} tone="violet" lock={<LockPin keys="element" size="md" />} />
      <div className="grid grid-cols-4 gap-1.5">
        {ELEMENTS.map((e) => {
          const active = config.element === e.id;
          return (
            <button key={e.id} onClick={() => applyElementId(e.id)} title={`${e.name} · ${e.desc}`}
              className={cn('flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-200',
                active ? 'bg-gradient-to-b from-white/15 to-white/5 text-white ring-1 ring-white/25' : 'text-stone-500 hover:bg-white/5 hover:text-stone-200')}
              style={active ? { boxShadow: `0 0 18px ${e.glow}55` } : undefined}>
              <span style={{ color: active ? e.glow : undefined }}>{GENERIC_ICONS[e.icon]}</span>
              <span className="text-[10px] font-bold leading-none">{e.name}</span>
              <span className="h-1 w-4 rounded-full" style={{ background: e.gem }} />
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 font-serif text-[12px] italic leading-relaxed text-stone-500">{el.desc}</p>
    </div>
  );
}

export function ItemTypePanel() {
  const { config, applyTypeId } = useForge();
  const it = getItemType(config.itemType);
  return (
    <div className="panel-luxe p-4">
      <PanelHead title="型 / Item Type" tag={it.nameEn} tone="amber" lock={<LockPin keys="itemType" size="md" />} />
      <div className="grid grid-cols-4 gap-1.5">
        {ITEM_TYPES.map((t) => (
          <button key={t.id} onClick={() => applyTypeId(t.id)} title={`${t.name} · ${t.desc}`}
            className={cn('flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-200',
              config.itemType === t.id ? 'bg-gradient-to-b from-amber-300/25 to-amber-500/10 text-amber-100 ring-1 ring-amber-300/40' : 'text-stone-500 hover:bg-white/5 hover:text-stone-200')}>
            {GENERIC_ICONS[t.icon]}
            <span className="text-[10px] font-bold leading-none">{t.name}</span>
          </button>
        ))}
      </div>
      <p className="mt-2.5 font-serif text-[12px] italic leading-relaxed text-stone-500">{it.desc}</p>
    </div>
  );
}

export function RarityPanel() {
  const { config } = useForge();
  const rarity = config.rarity ?? 'common';
  return (
    <div className="panel-luxe p-4">
      <PanelHead title="レアリティ" tag={rarity.toUpperCase()} tone="violet" lock={<LockPin keys="rarity" size="md" />} />
      <div className="flex gap-1.5">
        {RARITY_ORDER.map((r) => (
          <button key={r.id} onClick={() => useForge().update({ rarity: r.id })}
            className={cn('flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-all',
              rarity === r.id ? 'bg-gradient-to-b from-white/15 to-white/5 text-white ring-1 ring-white/25' : 'text-stone-500 hover:bg-white/5')}>
            <span className="h-1.5 w-5 rounded-full" style={{ background: r.color, boxShadow: rarity === r.id ? `0 0 10px ${r.color}` : 'none' }} />
            <span className="font-serif text-[11px] font-semibold leading-none">{r.name}</span>
          </button>
        ))}
      </div>
      <p className="mt-2.5 font-serif text-[12px] italic leading-relaxed text-stone-500">{RARITY_ORDER.find((r) => r.id === rarity)?.desc}</p>
    </div>
  );
}

const RARITY_ORDER = [
  { id: 'common' as const, name: 'コモン', color: '#a8a29e', desc: '素朴な量産品。装飾は控えめ。' },
  { id: 'uncommon' as const, name: 'アンコモン', color: '#4ade80', desc: 'わずかな魔力の気配が宿る。' },
  { id: 'rare' as const, name: 'レア', color: '#38bdf8', desc: '安定した魔力が循環する。' },
  { id: 'epic' as const, name: 'エピック', color: '#c084fc', desc: '装飾金具と光輪が宿る。' },
  { id: 'legendary' as const, name: 'レジェンダリー', color: '#fbbf24', desc: '浮遊物と二重の光輪を従える。' },
  { id: 'mythic' as const, name: 'ミシック', color: '#f472b6', desc: '翼が生え、虹色の粒子が舞う。' },
  { id: 'divine' as const, name: 'ディヴァイン', color: '#f4e3b0', desc: 'あらゆる装飾が最大限に開花する。' },
];

export function ModEssencePanel() {
  const { config, update } = useForge();
  const cur = getModEssence(config.modEssence ?? 'none');
  return (
    <div className="panel-luxe p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-[13px] font-bold uppercase tracking-[0.18em] text-emerald-100">
          <Sparkles className="h-4 w-4 text-emerald-300" /> Mod エッセンス <LockPin keys="modEssence" size="md" />
        </h2>
        <span className="rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-medium text-emerald-300">{cur.modSource}</span>
      </div>
      <OrnamentDivider className="mb-3 opacity-40" />
      <p className="mb-3 font-serif text-[12px] italic text-stone-400 leading-tight">Thaumcraft・Botania・Aether 等の質感DNAを注入。</p>
      <div className="grid grid-cols-3 gap-1.5">
        {MOD_ESSENCES.map((m) => {
          const active = (config.modEssence ?? 'none') === m.id;
          return (
            <button key={m.id} onClick={() => update({ modEssence: m.id })} title={`${m.name} (${m.modSource})\n${m.desc}`}
                className={cn('flex flex-col items-start gap-1 rounded-xl p-2 text-left transition-all',
                  active ? 'bg-gradient-to-b from-emerald-400/20 to-transparent text-emerald-100 ring-1 ring-emerald-300/30' : 'text-stone-400 hover:bg-white/5 hover:text-stone-200')}>
              <span className="text-[10px] font-bold leading-tight">{m.name}</span>
              <span className="text-[9px] text-stone-500">{m.modSource}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
