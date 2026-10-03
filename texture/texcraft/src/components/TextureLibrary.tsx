import { useMemo, useState } from 'react';
import { Check, ImagePlus, Plus, Search, ShieldCheck, Upload, X } from 'lucide-react';
import { SAMPLES, pfSamples, Sample } from '../lib/samples';
import { Tex, texToDataURL } from '../lib/tex';
import { cubeThumbnail } from '../lib/thumbnails';

export interface ImportedAsset { id: string; name: string; sources: Tex[] }
interface Props {
  selectedId: string | null;
  onSelect: (sample: Sample) => void;
  onImport: () => void;
  onNew: () => void;
  imports: ImportedAsset[];
  onUseImport: (asset: ImportedAsset) => void;
  full?: boolean;
}

function ProcTextures({ selectedId, search, onSelect }: { selectedId: string | null; search: string; onSelect: (sample: Sample) => void }) {
  const [items] = useState(() => pfSamples().map((s) => {
    const t = s.make();
    return { ...s, thumb: texToDataURL(t), w: t.w, h: t.h };
  }));
  const filtered = items.filter((s) => (s.name + s.id).toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="library-count"><span>手続き生成テクスチャ</span><span>{filtered.length}</span></div>
    <div className="texture-grid">{filtered.map((s) => <button key={s.id} className={`texture-item ${selectedId === s.id ? 'selected' : ''}`} title={`${s.name} · ${s.w} x ${s.h}px`} onClick={() => onSelect(s)}>
      <span className="texture-art flat"><img src={s.thumb} alt={s.name} draggable={false} loading="lazy" />{selectedId === s.id && <span className="texture-check"><Check size={10} strokeWidth={3} /></span>}</span><span className="texture-name">{s.name}</span>
    </button>)}</div>
  </>;
}

export default function TextureLibrary(p: Props) {
  const [tab, setTab] = useState<'library' | 'uploads' | 'proc'>('library');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const samples = useMemo(() => SAMPLES.map((s) => {
    const t = s.make();
    return { ...s, thumb: s.kind === 'block' ? cubeThumbnail(t, s.top?.()) : texToDataURL(t), w: t.w, h: t.h };
  }), []);
  const imported = useMemo(() => p.imports.map((a) => ({ ...a, thumb: texToDataURL(a.sources[0]) })), [p.imports]);
  const filtered = samples.filter((s) => (category === 'all' || category === s.kind) && (s.name + s.id).toLowerCase().includes(search.toLowerCase()));
  return <div className={`texture-library ${p.full ? 'full-library' : ''}`}>
    {!p.full && <div className="panel-title"><h2>テクスチャ</h2><button className="icon-button" onClick={p.onNew} aria-label="新規テクスチャ" title="新規テクスチャ"><Plus size={17} /></button></div>}
    <div className="library-controls">
      <div className="segmented"><button className={tab === 'library' ? 'selected' : ''} onClick={() => setTab('library')}>ライブラリ</button><button className={tab === 'proc' ? 'selected' : ''} onClick={() => setTab('proc')}>手続き生成</button><button className={tab === 'uploads' ? 'selected' : ''} onClick={() => setTab('uploads')}>アップロード {p.imports.length > 0 && <small>{p.imports.length}</small>}</button></div>
      <div className="search-field"><Search size={15} /><input aria-label="テクスチャを検索" placeholder="テクスチャを検索..." value={search} onChange={(e) => setSearch(e.target.value)} />{search && <button onClick={() => setSearch('')} aria-label="検索をクリア"><X size={13} /></button>}</div>
      {tab === 'library' && <div className="text-tabs texture-categories">{[['all', 'すべて'], ['block', 'ブロック'], ['item', 'アイテム'], ['other', 'その他']].map(([id, label]) => <button key={id} className={category === id ? 'selected' : ''} onClick={() => setCategory(id)}>{label}</button>)}</div>}
    </div>
    <div className="texture-scroll">
      {tab === 'library' ? <>
        <div className="library-count"><span>{category === 'all' ? 'すべてのテクスチャ' : category === 'block' ? 'ブロックテクスチャ' : category === 'item' ? 'アイテムテクスチャ' : 'スキン・UI・パーティクル'}</span><span>{filtered.length}</span></div>
        <div className="texture-grid">{filtered.map((s) => <button key={s.id} className={`texture-item ${p.selectedId === s.id ? 'selected' : ''}`} title={`${s.name} · ${s.w} x ${s.h}px`} onClick={() => p.onSelect(s)}>
          <span className={`texture-art ${s.kind !== 'block' ? 'flat' : ''}`}><img src={s.thumb} alt={s.name} draggable={false} loading="lazy" />{p.selectedId === s.id && <span className="texture-check"><Check size={10} strokeWidth={3} /></span>}</span><span className="texture-name">{s.name}</span>
        </button>)}</div>
        {!filtered.length && <div className="empty-state"><Search size={24} /><strong>見つかりませんでした</strong><p>別の名前で検索してください。</p><button className="text-button" onClick={() => { setCategory('all'); setSearch(''); }}>検索をリセット</button></div>}
      </> : tab === 'proc' ? <ProcTextures selectedId={p.selectedId} search={search} onSelect={p.onSelect} /> : <>
        <div className="library-count"><span>このセッションの画像</span><span>{imported.length}</span></div>
        <div className="texture-grid">{imported.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())).map((a) => <button className={`texture-item ${p.selectedId === a.id ? 'selected' : ''}`} key={a.id} onClick={() => p.onUseImport(a)}>
          <span className="texture-art flat"><img src={a.thumb} alt={a.name} />{p.selectedId === a.id && <span className="texture-check"><Check size={10} /></span>}</span><span className="texture-name">{a.name}</span>
        </button>)}</div>
        {!imported.length && <div className="empty-state"><ImagePlus size={28} /><strong>あなたのテクスチャで。</strong><p>ブロック、アイテム、スキン、UI。お好きな画像を読み込めます。</p><button className="secondary-button" onClick={p.onImport}><Upload size={14} /> 画像を選ぶ</button></div>}
      </>}
    </div>
    <div className="library-bottom"><button className="import-dropzone" onClick={p.onImport}><Upload size={19} /><strong>テクスチャを読み込む</strong><span>クリックまたはドラッグ＆ドロップ</span><small>PNG / JPG / WEBP · 16–128px</small></button><p className="local-notice"><ShieldCheck size={12} /> 画像はすべて端末内で処理されます</p></div>
  </div>;
}