import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Download, Film, FolderArchive, Images, Layers, LoaderCircle, Palette, Play, Puzzle, Swords, Wand2 } from 'lucide-react';
import { Zippable, strToU8, zipSync } from 'fflate';
import Modal from './Modal';
import { Ctx, GROUPS, GroupId, Variant, variantsOf } from '../lib/evolution';
import { accentOf, isOpaqueTex } from '../lib/geometry';
import { Tex, downloadBlob, fitTex, stackVertical, texToCanvas, texToDataURL, download } from '../lib/tex';
import WeaponWorkshop, { WorkshopMode } from './WeaponWorkshop';
import { PART_LIBRARY } from '../lib/weaponParts';
import { WorkshopState } from '../lib/workshopTypes';

interface Props { base: Tex; processed: Tex; name: string; fps: number; workshop: WorkshopState; onWorkshopChange: (state: WorkshopState) => void; onOpen: (frames: Tex[], suffix: string, label: string) => void; onClose: () => void; onNotify: (m: string, error?: boolean) => void }
interface Built { frames: Tex[]; urls: string[] }
const PACK_FORMATS: [number, string][] = [[15, '1.20 – 1.20.1'], [18, '1.20.2'], [22, '1.20.3 – 1.20.4'], [32, '1.20.5 – 1.20.6'], [34, '1.21 – 1.21.1'], [42, '1.21.2 – 1.21.3'], [46, '1.21.4'], [55, '1.21.5'], [63, '1.21.6+']];
const pngBytes = (t: Tex) => Uint8Array.from(atob(texToDataURL(t).split(',')[1]), (c) => c.charCodeAt(0));
const safe = (s: string) => s.replace(/[^a-z\d_.-]/gi, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'item';

export default function ForgeLab({ base, processed, name, fps, workshop, onWorkshopChange, onOpen, onClose, onNotify }: Props) {
  const [tab, setTab] = useState<'variants' | WorkshopMode>('parts');
  const [group, setGroup] = useState<GroupId>('tier');
  const [source, setSource] = useState<'original' | 'processed'>('original');
  const [accent, setAccent] = useState(() => accentOf(processed));
  const [frameCount, setFrameCount] = useState(8);
  const [packFormat, setPackFormat] = useState(34);
  const [cache, setCache] = useState<Record<string, Built>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const version = useRef(0);
  const full = source === 'processed' ? processed : base;
  const opaque = useMemo(() => isOpaqueTex(full), [full]);
  const previewBase = useMemo(() => fitTex(full, Math.min(Math.max(full.w, full.h), 48)), [full]);
  const ctxKey = `${source}|${accent}|${frameCount}`;
  const variants = variantsOf(group);
  const groupDef = GROUPS.find((g) => g.id === group)!;
  const disabled = opaque && !!groupDef.itemOnly;

  useEffect(() => { setCache({}); version.current++; }, [ctxKey]);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 1000 / fps); return () => clearInterval(id); }, [fps]);

  useEffect(() => {
    if (disabled) return;
    const v = ++version.current;
    let cancelled = false;
    (async () => {
      for (const variant of variants) {
        if (cancelled || version.current !== v) return;
        if (cache[variant.id]) continue;
        setBusy(variant.id);
        await new Promise((r) => setTimeout(r, 0));
        try {
          const frames = variant.build({ base: previewBase, accent, seed: 5, frames: variant.animated ? frameCount : 1 });
          const built = { frames, urls: frames.map((f) => texToDataURL(f)) };
          if (!cancelled && version.current === v) setCache((c) => ({ ...c, [variant.id]: built }));
        } catch (e) { console.error(e); }
      }
      setBusy(null);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, ctxKey, disabled]);

  const buildFull = (variant: Variant): Tex[] => {
    const c: Ctx = { base: full, accent, seed: 5, frames: variant.animated ? frameCount : 1 };
    return variant.build(c);
  };
  const filesFor = (variant: Variant, frames: Tex[], prefix: string) => {
    const file = `${prefix}${safe(name)}_${variant.id}`;
    const out: Zippable = {};
    out[`${file}.png`] = [pngBytes(variant.animated ? stackVertical(frames) : frames[0]), { level: 0 }];
    if (variant.animated) out[`${file}.png.mcmeta`] = strToU8(JSON.stringify({ animation: { frametime: Math.max(1, Math.round(20 / fps)), interpolate: false } }, null, 2));
    return out;
  };
  const withBusy = async <T,>(label: string, fn: () => T | Promise<T>) => {
    setBusy(label);
    await new Promise((r) => setTimeout(r, 20));
    try { return await fn(); } catch (e) { console.error(e); onNotify('生成に失敗しました。解像度を下げて再度お試しください。', true); }
    finally { setBusy(null); }
  };
  const saveOne = (variant: Variant) => withBusy(variant.id, () => {
    const frames = buildFull(variant);
    if (!variant.animated) { download(texToDataURL(frames[0]), `${safe(name)}_${variant.id}.png`); }
    else { const zipped = zipSync(filesFor(variant, frames, '')); downloadBlob(new Blob([new Uint8Array(zipped)], { type: 'application/zip' }), `${safe(name)}_${variant.id}.zip`); }
    onNotify(`${variant.name} を書き出しました`);
  });
  const openOne = (variant: Variant) => withBusy(variant.id, () => { onOpen(buildFull(variant), variant.id, variant.name); });
  const zipGroup = (list: Variant[], label: string, pack: boolean) => withBusy('zip', () => {
    const prefix = pack ? 'assets/minecraft/textures/item/' : '';
    let files: Zippable = {};
    for (const v of list) files = { ...files, ...filesFor(v, buildFull(v), prefix) };
    if (pack) files['pack.mcmeta'] = strToU8(JSON.stringify({ pack: { pack_format: packFormat, description: `TexCraft variants of ${name}` } }, null, 2));
    files['README.txt'] = strToU8(`TexCraft 進化ラボ 書き出し\n元テクスチャ: ${name} (${full.w}x${full.h})\n${list.length} バリアント / ${fps}fps\n\n${list.map((v) => `${safe(name)}_${v.id}.png  -  ${v.name}${v.animated ? ' (アニメーション: 縦ストリップ + .mcmeta)' : ''}`).join('\n')}\n\n※ 各バリアントを別アイテムとして使うには、モデルJSONやcustom_model_dataなどの設定が別途必要です。`);
    const zipped = zipSync(files);
    downloadBlob(new Blob([new Uint8Array(zipped)], { type: 'application/zip' }), `${safe(name)}_${label}.zip`);
    onNotify(`${list.length} バリアントをZIPに書き出しました`);
  });
  const saveSheet = (list: Variant[], label: string) => withBusy('sheet', () => {
    const cell = 96, gap = 28, pad = 24, labelH = 30;
    const canvas = document.createElement('canvas');
    canvas.width = pad * 2 + list.length * cell + (list.length - 1) * gap;
    canvas.height = pad * 2 + cell + labelH;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1a1f1b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    list.forEach((v, i) => {
      const frames = buildFull(v);
      const f = frames[Math.floor(frames.length / 3)];
      const x = pad + i * (cell + gap), s = cell / Math.max(f.w, f.h);
      ctx.fillStyle = '#242a25'; ctx.fillRect(x - 6, pad - 6, cell + 12, cell + 12);
      ctx.drawImage(texToCanvas(f), x + (cell - f.w * s) / 2, pad + (cell - f.h * s) / 2, f.w * s, f.h * s);
      ctx.fillStyle = '#c9d8bb'; ctx.font = '600 12px "Noto Sans JP", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(v.name, x + cell / 2, pad + cell + 22);
      if (group === 'tier' && i < list.length - 1) { ctx.fillStyle = '#b9ed80'; ctx.font = '16px sans-serif'; ctx.fillText('→', x + cell + gap / 2, pad + cell / 2 + 6); }
    });
    download(canvas.toDataURL('image/png'), `${safe(name)}_${label}_sheet.png`);
    onNotify('一覧画像を書き出しました');
  });

  const done = variants.filter((v) => cache[v.id]).length;
  return <Modal title="進化ラボ" subtitle="パーツを組み立て、モーションを作り、エフェクトを重ねる。" wide onClose={onClose}>
    <nav className="forge-tabs" aria-label="武器制作モード">
      <button className={tab === 'parts' ? 'selected' : ''} onClick={() => setTab('parts')}><Puzzle size={15} /><span>パーツを追加</span><small>{PART_LIBRARY.length}</small></button>
      <button className={tab === 'animation' ? 'selected' : ''} onClick={() => setTab('animation')}><Film size={15} /><span>アニメーション</span><small>KEYFRAMES</small></button>
      <button className={tab === 'effects' ? 'selected' : ''} onClick={() => setTab('effects')}><Layers size={15} /><span>エフェクトを追加</span><small>56+</small></button>
      <button className={tab === 'variants' ? 'selected' : ''} onClick={() => setTab('variants')}><Wand2 size={15} /><span>自動バリエーション</span><small>52</small></button>
    </nav>
    {tab !== 'variants' && <WeaponWorkshop mode={tab} active base={full} name={name} accent={accent} fps={fps} workshop={workshop} onWorkshopChange={onWorkshopChange}
      onNotify={onNotify} onOpen={onOpen} />}
    {tab === 'variants' && <div className="forge">
      <aside className="forge-side">
        <div className="forge-source">
          <span className="forge-source-image checker"><img src={texToDataURL(full)} alt="" /></span>
          <div><strong>{name}</strong><small>{full.w} × {full.h} px {opaque ? '· ブロック' : '· アイテム'}</small></div>
        </div>
        <div className="segmented"><button className={source === 'original' ? 'selected' : ''} onClick={() => setSource('original')}>元画像</button><button className={source === 'processed' ? 'selected' : ''} onClick={() => setSource('processed')}>編集後</button></div>
        <label className="inline-control"><span><Palette size={12} /> アクセント色</span><span className="color-control"><span className="color-chip" style={{ background: accent }}><input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} aria-label="アクセント色" /></span><button className="text-button" onClick={() => setAccent(accentOf(full))}>自動</button></span></label>
        <label className="inline-control"><span>アニメのフレーム数</span><select value={frameCount} onChange={(e) => setFrameCount(Number(e.target.value))}>{[8, 12, 16, 24].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        <nav className="forge-groups">{GROUPS.map((g) => <button key={g.id} className={g.id === group ? 'selected' : ''} onClick={() => setGroup(g.id)}><span>{g.name}</span><small>{g.en} · {variantsOf(g.id).length}</small></button>)}</nav>
        <div className="forge-pack"><label className="inline-control"><span>pack_format</span><select value={packFormat} onChange={(e) => setPackFormat(Number(e.target.value))}>{PACK_FORMATS.map(([v, l]) => <option key={v} value={v}>{v} ({l})</option>)}</select></label>
          <button className="primary-button" disabled={!!busy} onClick={() => zipGroup(GROUPS.filter((g) => !(opaque && g.itemOnly)).flatMap((g) => variantsOf(g.id)), 'all_variants', true)}><FolderArchive size={15} /> 全バリアントをリソースパック形式でZIP</button>
          <p className="field-note">assets/minecraft/textures/item/ に全テクスチャと .mcmeta、pack.mcmeta を同梱。別アイテムとして使うにはモデル設定が別途必要です。</p></div>
      </aside>
      <section className="forge-main">
        <header className="forge-head"><div><h3><Swords size={15} /> {groupDef.name} <span>{groupDef.en}</span></h3><p>{groupDef.desc}</p></div>
          <div className="forge-head-actions">{busy ? <span className="forge-progress"><LoaderCircle size={13} className="spin" /> {busy === 'zip' || busy === 'sheet' ? '書き出し中…' : `生成中 ${done}/${variants.length}`}</span> : <span className="forge-progress"><Check size={13} /> {done}/{variants.length}</span>}
            <button className="secondary-button" disabled={!!busy || disabled} onClick={() => saveSheet(variants, group)}><Images size={14} /> 一覧画像</button>
            <button className="secondary-button" disabled={!!busy || disabled} onClick={() => zipGroup(variants, group, false)}><FolderArchive size={14} /> このグループをZIP</button></div></header>
        {disabled ? <div className="empty-state"><Swords size={26} /><strong>このグループはアイテム（透過あり）専用です</strong><p>ブロックテクスチャでは形態変化・攻撃アニメは生成しません。他のグループ（段階強化・属性・素材・モード）はご利用いただけます。</p></div> :
          <div className="forge-grid">{variants.map((v, i) => {
            const b = cache[v.id];
            const url = b ? b.urls[tick % b.urls.length] : null;
            return <article key={v.id} className={`forge-card ${b ? '' : 'pending'}`}>
              <div className="forge-art checker">{url ? <img src={url} alt={v.name} /> : <LoaderCircle size={18} className="spin" />}<span className="forge-orig checker" title="元のテクスチャ"><img src={texToDataURL(full)} alt="" /></span>{v.tag && <span className="forge-tag">{v.tag}</span>}{v.animated && <span className="forge-anim"><Play size={9} /> {b ? b.urls.length : frameCount}f</span>}{group === 'tier' && i < variants.length - 1 && <ArrowRight size={14} className="forge-arrow" />}</div>
              <strong>{v.name}</strong><p>{v.desc}</p>
              <div className="forge-card-actions"><button className="secondary-button" disabled={!b || !!busy} onClick={() => openOne(v)}><Wand2 size={13} /> エディターで開く</button><button className="icon-button" title={v.animated ? 'PNGストリップ + mcmeta をZIP保存' : 'PNG保存'} aria-label="保存" disabled={!b || !!busy} onClick={() => saveOne(v)}><Download size={15} /></button></div>
            </article>;
          })}</div>}
      </section>
    </div>}
  </Modal>;
}
