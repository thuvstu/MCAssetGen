import { useMemo, useState } from 'react';
import { ArrowDownToLine, Check, FileImage, FileJson, Film, Image, Layers, Plus, Upload } from 'lucide-react';
import { strToU8, zipSync } from 'fflate';
import Modal from './Modal';
import { EditorDoc, serializeProject } from '../lib/project';
import { RESOLUTIONS, Tex, createTex, download, downloadBlob, fitTex, hexToRgb, imageToFrames, stackVertical, texToCanvas, texToDataURL } from '../lib/tex';

export interface PendingImage { image: HTMLImageElement; name: string }

export function ImportDialog({ pending, onClose, onImport }: { pending: PendingImage; onClose: () => void; onImport: (sources: Tex[], name: string, keep: boolean) => void }) {
  const [size, setSize] = useState(0);
  const [animated, setAnimated] = useState(false);
  const [keep, setKeep] = useState(false);
  const [name, setName] = useState(pending.name.replace(/\.[^.]+$/, ''));
  const image = pending.image;
  const stripCount = image.naturalHeight / image.naturalWidth;
  const canAnimate = Number.isInteger(stripCount) && stripCount > 1 && stripCount <= 64;
  const imported = useMemo(() => {
    try {
      const frames = imageToFrames(image, size, animated);
      return { frames, preview: texToDataURL(frames[0]), error: '' };
    } catch {
      return { frames: [] as Tex[], preview: '', error: '画像を変換できませんでした。PNG・JPEG・WebP形式で保存し直してください。' };
    }
  }, [image, size, animated]);
  const { frames, preview, error } = imported;
  return <Modal title="テクスチャを読み込む" subtitle="ピクセルの輪郭と透過を、そのままに。" onClose={onClose}>
    <div className="dialog-body">
      <div className="import-preview checker">{preview ? <img src={preview} alt="読み込みプレビュー" /> : <FileImage size={32} />}</div>
      <div className="image-information"><span>元の画像</span><span>{image.naturalWidth} × {image.naturalHeight} px</span></div>
      <label className="form-field">テクスチャ名<input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} /></label>
      <label className="form-field">読み込み方法<select value={animated ? 'strip' : 'whole'} onChange={(e) => setAnimated(e.target.value === 'strip')}><option value="whole">画像全体（ブロック・アイテム・スキン・UI）</option><option value="strip" disabled={!canAnimate}>アニメーションストリップ{canAnimate ? ` (${stripCount}フレーム)` : ' (縦並びの正方形フレームが必要)'}</option></select></label>
      <div className="form-field"><span>解像度 <small>縦横比を保持・ニアレストネイバー</small></span><div className="resolution-options"><button className={size === 0 ? 'selected' : ''} onClick={() => setSize(0)}>自動</button>{RESOLUTIONS.map((n) => <button key={n} className={size === n ? 'selected' : ''} onClick={() => setSize(n)}>{n}<small>px</small></button>)}</div></div>
      {frames[0] && <p className="field-note">読み込み後: {frames[0].w} × {frames[0].h} px {animated && ` / ${frames.length} フレーム`}。16〜128pxの範囲に合わせます。元のファイルは変更しません。</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <label className="check-label"><input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} /> 現在のエフェクトを引き継ぐ</label>
    </div>
    <footer className="modal-footer"><button className="secondary-button" onClick={onClose}>キャンセル</button><button className="primary-button" disabled={!name.trim() || !frames.length} onClick={() => onImport(frames, name.trim(), keep)}><Upload size={15} /> 読み込む</button></footer>
  </Modal>;
}

export function NewDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (tex: Tex, name: string) => void }) {
  const [size, setSize] = useState(32);
  const [name, setName] = useState('new_texture');
  const [transparent, setTransparent] = useState(true);
  const [color, setColor] = useState('#656b65');
  return <Modal title="新しいテクスチャ" subtitle="ひとつのピクセルから、あなたの世界を。" onClose={onClose}>
    <div className="dialog-body"><label className="form-field">テクスチャ名<input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} /></label><div className="form-field"><span>キャンバスサイズ</span><div className="resolution-options">{RESOLUTIONS.map((n) => <button className={size === n ? 'selected' : ''} key={n} onClick={() => setSize(n)}>{n} × {n}</button>)}</div></div>
      <label className="check-label"><input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} /> 背景を透明にする</label>{!transparent && <label className="inline-control">背景色<input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>}
      <p className="field-note">新しく作成するとエフェクトがリセットされます。現在の作業は「元に戻す」で復元できます。</p>
    </div><footer className="modal-footer"><button className="secondary-button" onClick={onClose}>キャンセル</button><button className="primary-button" disabled={!name.trim()} onClick={() => {
      const tex = createTex(size, size), rgb = hexToRgb(color);
      if (!transparent) for (let i = 0; i < tex.d.length; i += 4) tex.d.set([...rgb, 255], i);
      onCreate(tex, name.trim());
    }}><Plus size={15} /> 作成する</button></footer>
  </Modal>;
}

export function ExportDialog({ doc, frames, frameIndex, fps, onClose, onNotify }: { doc: EditorDoc; frames: Tex[]; frameIndex: number; fps: number; onClose: () => void; onNotify: (s: string) => void }) {
  const [format, setFormat] = useState<'png' | 'animation' | 'comparison' | 'project'>('png');
  const [size, setSize] = useState(0);
  const [name, setName] = useState(doc.name.replace(/[^a-z\d_.-]/gi, '_').toLowerCase());
  const [error, setError] = useState('');
  const current = frames[frameIndex % frames.length];
  const output = useMemo(() => size ? fitTex(current, size) : current, [current, size]);
  const preview = useMemo(() => texToDataURL(output), [output]);
  const extension = format === 'animation' ? '.zip' : format === 'project' ? '.texcraft.json' : '.png';
  const exportFile = () => {
    try {
      setError('');
      const safe = name.replace(/[^a-z\d_.-]/gi, '_').replace(/^\.+/, '') || 'texture';
      if (format === 'png') download(preview, `${safe}.png`);
      else if (format === 'project') downloadBlob(new Blob([serializeProject({ ...doc, name: safe })], { type: 'application/json' }), `${safe}.texcraft.json`);
      else if (format === 'animation') {
        const resized = size ? frames.map((f) => fitTex(f, size)) : frames;
        const data = texToDataURL(stackVertical(resized));
        const png = Uint8Array.from(atob(data.split(',')[1]), (c) => c.charCodeAt(0));
        const metadata = { animation: { width: resized[0].w, height: resized[0].h, frametime: Math.max(1, Math.round(20 / fps)), interpolate: false } };
        const zipped = zipSync({ [`${safe}.png`]: [png, { level: 0 }], [`${safe}.png.mcmeta`]: strToU8(JSON.stringify(metadata, null, 2)) });
        downloadBlob(new Blob([new Uint8Array(zipped)], { type: 'application/zip' }), `${safe}.zip`);
      } else {
        const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')!;
        const scale = Math.max(1, Math.floor(320 / Math.max(output.w, output.h))), w = output.w * scale, h = output.h * scale;
        canvas.width = w * 2 + 72; canvas.height = h + 88;
        ctx.fillStyle = '#191c1b'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.imageSmoothingEnabled = false;
        const sourceIndex = Math.floor((frameIndex % frames.length) / frames.length * doc.sources.length);
        ctx.drawImage(texToCanvas(doc.sources[sourceIndex]), 24, 24, w, h); ctx.drawImage(texToCanvas(output), w + 48, 24, w, h);
        ctx.fillStyle = '#9ba49c'; ctx.font = '12px sans-serif'; ctx.fillText('ORIGINAL', 24, h + 55); ctx.fillStyle = '#b9ed80'; ctx.fillText('TEXCRAFT', w + 48, h + 55);
        download(canvas.toDataURL('image/png'), `${safe}_comparison.png`);
      }
      onNotify(`${safe}${extension} を書き出しました`);
      onClose();
    } catch { setError('書き出せませんでした。解像度を下げて再度お試しください。'); }
  };
  return <Modal title="作品をエクスポート" subtitle="あなたのテクスチャを、Minecraftの世界へ。" onClose={onClose}>
    <div className="dialog-body">
      <div className="export-preview-row"><div className="export-preview checker"><img src={preview} alt="書き出しプレビュー" /></div><div><strong>{doc.name}.png</strong><p>{output.w} × {output.h} px · RGBA</p><span className="lossless-label"><Check size={12} /> ピクセルをそのまま保存</span></div></div>
      <div className="format-options">{([['png', 'PNG 画像', FileImage], ['animation', 'アニメーション', Film], ['comparison', '比較画像', Image], ['project', 'プロジェクト', FileJson]] as const).map(([v, label, Icon]) => <button key={v} className={format === v ? 'selected' : ''} onClick={() => setFormat(v)} disabled={v === 'animation' && frames.length < 2} title={v === 'animation' && frames.length < 2 ? 'アニメーション効果を追加すると選べます' : undefined}><Icon size={20} /><span>{label}</span></button>)}</div>
      <label className="form-field">ファイル名<div className="filename-input"><input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} /><span>{extension}</span></div></label>
      {format !== 'project' && <div className="form-field"><span>出力解像度 <small>長辺のサイズ</small></span><div className="resolution-options"><button className={!size ? 'selected' : ''} onClick={() => setSize(0)}>現在のサイズ</button>{RESOLUTIONS.map((n) => <button key={n} className={size === n ? 'selected' : ''} onClick={() => setSize(n)}>{n}<small>px</small></button>)}</div></div>}
      {format === 'animation' && <div className="export-explanation"><Film size={17} /><p>{frames.length}フレーム · {fps}fps<br />縦ストリップPNGと .mcmeta をZIPにまとめます。Java Edition向けの素材で、完成したリソースパックではありません。</p></div>}
      {format === 'project' && <div className="export-explanation"><Layers size={17} /><p>元の画像・全フレーム・エフェクト設定を保存。JSONファイルを読み込めば、後から再編集できます。</p></div>}
      {format === 'png' && <p className="field-note">現在表示中のフレームを保存します。透過部分は保持され、グリッドや背景は書き出されません。</p>}
      {format === 'comparison' && <p className="field-note">元画像と編集結果を横に並べた比較画像を書き出します。</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div><footer className="modal-footer"><span className="footer-caption">すべてブラウザー内で完結</span><button className="primary-button" disabled={!name.trim()} onClick={exportFile}><ArrowDownToLine size={15} /> ダウンロード</button></footer>
  </Modal>;
}