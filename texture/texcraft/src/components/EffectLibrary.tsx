import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, ChevronRight, Play, Plus, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { CategoryId, EFFECTS, EffectDef, Params, applyStack, newLayer } from '../lib/effects';
import { PRESETS, Preset, presetLayers } from '../lib/presets';
import { Tex, fitTex, texToDataURL } from '../lib/tex';
import { cubeThumbnail } from '../lib/thumbnails';

const FEATURED = ['enchant', 'glow', 'metal', 'weather', 'crystalline', 'sparkle'];
export const EFFECT_CATEGORIES: [CategoryId | 'all', string][] = [['all', 'すべて'], ['texture', '質感'], ['decor', '装飾・発光'], ['color', '色調'], ['anim', 'アニメーション'], ['transform', '変形・HD']];

export function smartParams(id: string, base: Tex): Params {
  const opaque = base.d.every((v, i) => i % 4 !== 3 || v >= 128);
  if (id === 'glow' && opaque) return { mode: 'bloom', color: '#a5f9e6' };
  if (id === 'outline' && opaque) return { mode: 'inner' };
  return {};
}

function EffectTile({ effect, base, onAdd, full }: { effect: EffectDef; base: Tex; onAdd: (id: string) => void; full?: boolean }) {
  const [added, setAdded] = useState(false);
  const image = useMemo(() => {
    const source = fitTex(base, 32);
    const result = applyStack(source, [newLayer(effect.id, smartParams(effect.id, source), 43)], 0.3);
    const opaque = source.w === source.h && source.d.every((v, i) => i % 4 !== 3 || v >= 128);
    return opaque ? cubeThumbnail(result) : texToDataURL(result);
  }, [effect.id, base]);
  return <button className={`effect-tile ${added ? 'just-added' : ''}`} title={`${effect.name}: ${effect.desc}`} onClick={() => { onAdd(effect.id); setAdded(true); setTimeout(() => setAdded(false), 1100); }}>
    <span className={`effect-art effect-${effect.category}`}><img src={image} alt={`${effect.name}のプレビュー`} draggable={false} loading="lazy" /><span className="effect-add">{added ? <Check size={13} /> : <Plus size={13} />}</span>{effect.isNew && <span className="new-indicator">NEW</span>}</span>
    <span className="effect-name">{effect.id === 'enchant' ? 'エンチャント' : effect.id === 'metal' ? 'メタリック' : effect.id === 'glow' ? 'グロー' : effect.id === 'weather' ? '苔・風化' : effect.name}{effect.animated && <Play size={10} />}</span>
    {full && <span className="effect-description">{effect.desc}</span>}
  </button>;
}

export function EffectLibrary({ base, onAdd, onExpand, full = false }: { base: Tex; onAdd: (id: string) => void; onExpand?: () => void; full?: boolean }) {
  const [category, setCategory] = useState<CategoryId | 'all'>('all');
  const [search, setSearch] = useState('');
  const [onlyNew, setOnlyNew] = useState(false);
  const sorted = useMemo(() => [...EFFECTS].sort((a, b) => {
    const ai = FEATURED.indexOf(a.id), bi = FEATURED.indexOf(b.id);
    return (ai < 0 ? 100 : ai) - (bi < 0 ? 100 : bi);
  }), []);
  const filtered = sorted.filter((e) => (category === 'all' || category === e.category) && (!onlyNew || e.isNew) && (e.name + e.desc + e.id).toLowerCase().includes(search.toLowerCase()));
  return <section className={`effect-library ${full ? 'full-effects' : ''}`}>
    {!full && <div className="effect-shelf-heading"><div><Sparkles size={16} /><h2>エフェクトライブラリ</h2><span>{EFFECTS.length} effects</span></div><button className="text-button" onClick={onExpand}>すべて見る <ArrowUpRight size={13} /></button></div>}
    <div className="effect-filters"><div className="text-tabs">{EFFECT_CATEGORIES.map(([id, label]) => <button key={id} className={id === category ? 'selected' : ''} onClick={() => setCategory(id)}>{label}</button>)}</div>{full ? <>
      <div className="search-field"><Search size={14} /><input aria-label="エフェクトを検索" placeholder="エフェクトを検索..." value={search} onChange={(e) => setSearch(e.target.value)} />{search && <button onClick={() => setSearch('')} aria-label="検索をクリア"><X size={13} /></button>}</div>
      <button className={`secondary-button new-filter ${onlyNew ? 'selected' : ''}`} onClick={() => setOnlyNew(!onlyNew)}><Sparkles size={13} /> 新しい効果</button>
    </> : <button className="icon-button filter-button" title="エフェクトを検索" aria-label="エフェクトを検索" onClick={onExpand}><SlidersHorizontal size={14} /></button>}</div>
    <div className="effect-grid">{(full ? filtered : filtered.slice(0, 6)).map((effect) => <EffectTile key={effect.id} effect={effect} base={base} onAdd={onAdd} full={full} />)}</div>
    {full && <div className="effect-library-footer"><span>{filtered.length} 件のエフェクト</span><span>クリックでレイヤーとして追加 <ChevronRight size={12} /></span></div>}
    {!filtered.length && <div className="empty-state"><Search size={25} /><strong>エフェクトが見つかりません</strong><button className="text-button" onClick={() => { setCategory('all'); setSearch(''); setOnlyNew(false); }}>フィルターをリセット</button></div>}
  </section>;
}

export function PresetLibrary({ base, onApply }: { base: Tex; onApply: (p: Preset, append: boolean) => void }) {
  const [append, setAppend] = useState(false);
  const thumbs = useMemo(() => {
    const source = fitTex(base, 32), opaque = source.w === source.h && source.d.every((v, i) => i % 4 !== 3 || v >= 128);
    return PRESETS.map((preset) => {
      const result = applyStack(source, presetLayers(preset), 0.25);
      return { preset, image: opaque ? cubeThumbnail(result, result, 180) : texToDataURL(result) };
    });
  }, [base]);
  return <div className="preset-library"><div className="preset-note"><span>{PRESETS.length}種類のスタイルで、新しい表情に。</span><label><input type="checkbox" checked={append} onChange={(e) => setAppend(e.target.checked)} /> 現在のエフェクトに重ねる</label></div><div className="preset-grid">{thumbs.map(({ preset, image }) => <button className="preset-item" key={preset.id} onClick={() => onApply(preset, append)}><span className="preset-art"><img src={image} alt={preset.name} /></span><strong>{preset.name}</strong><span>{preset.desc}</span><small>{preset.layers.length} エフェクト <Plus size={13} /></small></button>)}</div></div>;
}