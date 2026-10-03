import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown, ArrowUp, Check, Copy, Download, Eye, EyeOff, GripVertical,
  Layers, LoaderCircle, Move, Pause, Play, Plus, RotateCcw, Trash2,
  WandSparkles, X,
} from 'lucide-react';
import { Zippable, zipSync, strToU8 } from 'fflate';
import { EffectLibrary, smartParams } from './EffectLibrary';
import LayerPanel, { RangeControl } from './LayerPanel';
import { Layer, newLayer } from '../lib/effects';
import { Tex, download, downloadBlob, hexToRgb, stackVertical, texToDataURL } from '../lib/tex';
import * as G from '../lib/geometry';
import { PartKind, PartLayer, PART_LIBRARY, createPart, hasAnimatedEffects, hasAnimatedParts, renderParts, renderWeaponFrame } from '../lib/weaponParts';
import { KeyPose, WorkshopState } from '../lib/workshopTypes';

export type WorkshopMode = 'parts' | 'animation' | 'effects';
interface Props {
  mode: WorkshopMode;
  active: boolean;
  base: Tex;
  name: string;
  accent: string;
  fps: number;
  workshop: WorkshopState;
  onWorkshopChange: (state: WorkshopState) => void;
  onOpen: (frames: Tex[], suffix: string, label: string) => void;
  onNotify: (message: string, error?: boolean) => void;
}

type Pose = KeyPose;
interface Motion { id: string; name: string; desc: string; keys: Omit<Pose, 'id'>[] }
const pose = (time: number, label: string, angle: number, x = 0, y = 0, scale = 0.76): Omit<Pose, 'id'> => ({ time, label, angle, x, y, scale });
export const MOTIONS: Motion[] = [
  { id: 'idle', name: '浮遊待機', desc: '武器を見せるゆるやかな揺れ', keys: [pose(0, '中央', 0), pose(0.25, '左へ', -5, -1, 0, 0.76), pose(0.5, '中央', 0), pose(0.75, '右へ', 5, 1, 0, 0.76), pose(1, '中央', 0)] },
  { id: 'slash', name: '斬撃', desc: '引く → 振り抜く → 止める', keys: [pose(0, '構え', 0), pose(0.2, '振りかぶり', -43, -1, 1), pose(0.4, '加速', -26, -1, 0), pose(0.58, '一閃', 32, 2, -1), pose(0.78, '止め', 24, 1, 0), pose(1, '構え', 0)] },
  { id: 'combo', name: '二連斬', desc: '左右への二連撃', keys: [pose(0, '構え', 0), pose(0.17, '一段目', -42, -1, 0), pose(0.34, '戻し', 35, 1, 0), pose(0.52, '二段目', 48, 2, -1), pose(0.73, '止め', -17, 0, 1), pose(1, '構え', 0)] },
  { id: 'thrust', name: '突き', desc: '重心をためて、前へ突き出す', keys: [pose(0, '戻す', 0), pose(0.22, '溜め', -12, -2, 0), pose(0.43, '突き', 0, 5, -2, 0.72), pose(0.6, '到達', 0, 6, -2, 0.7), pose(0.82, '引き戻し', 4, 2, -1), pose(1, '戻す', 0)] },
  { id: 'smash', name: '振り下ろし', desc: '頭上に構え、一気に叩きつける', keys: [pose(0, '構え', 0), pose(0.23, '振り上げ', -48, -1, -2, 0.78), pose(0.42, '最高点', -54, -1, -3, 0.76), pose(0.61, '着弾', 45, 2, 2, 0.76), pose(0.79, '反動', 22, 1, 1), pose(1, '構え', 0)] },
  { id: 'spin', name: '回転斬り', desc: '全周を薙ぎ払う', keys: [pose(0, '開始', 0), pose(0.25, '右', 90, 0, 0, 0.68), pose(0.5, '後ろ', 180, 0, 0, 0.68), pose(0.75, '左', 270, 0, 0, 0.68), pose(1, '開始', 360, 0, 0, 0.76)] },
  { id: 'guard', name: '防御', desc: '横向きに構え、盾の軌跡を出す', keys: [pose(0, '通常', 0), pose(0.26, '防御移行', 28, 1, 0), pose(0.4, '防御', 52, 1, 0), pose(0.76, '防御維持', 52, 1, 0), pose(1, '通常', 0)] },
  { id: 'cast', name: '魔法詠唱', desc: '武器を掲げ、陣を回す', keys: [pose(0, '待機', 0), pose(0.22, '掲げる', -24, 0, -2), pose(0.46, '集中', -38, 0, -3, 0.73), pose(0.73, '発動', -24, 1, -2), pose(1, '待機', 0)] },
  { id: 'custom', name: 'カスタム', desc: 'キーフレームから自由に作る', keys: [pose(0, '開始', 0), pose(0.35, '中間', -35), pose(0.7, '到達', 35), pose(1, '終了', 0)] },
];
const keyId = () => `key-${Math.random().toString(36).slice(2, 8)}`;
const findMotion = (id: string) => MOTIONS.find((m) => m.id === id) || MOTIONS[1];

function interpolatePose(keys: Pose[], time: number): Pose {
  const sorted = [...keys].sort((a, b) => a.time - b.time);
  if (!sorted.length) return { id: 'default', time, label: '待機', angle: 0, x: 0, y: 0, scale: 0.76 };
  if (time <= sorted[0].time) return sorted[0];
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1];
  const i = sorted.findIndex((k, n) => n < sorted.length - 1 && time >= k.time && time <= sorted[n + 1].time);
  const a = sorted[i], b = sorted[i + 1], raw = (time - a.time) / Math.max(0.0001, b.time - a.time);
  const t = raw * raw * (3 - 2 * raw);
  return { id: 'interpolated', time, label: a.label, angle: a.angle + (b.angle - a.angle) * t, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, scale: a.scale + (b.scale - a.scale) * t };
}

function copyPart(p: PartLayer): PartLayer { return { ...p, id: `part-${Math.random().toString(36).slice(2, 9)}` }; }

export default function WeaponWorkshop(p: Props) {
  const [parts, setParts] = useState<PartLayer[]>(() => p.workshop.parts);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [effects, setEffects] = useState<Layer[]>(() => p.workshop.effects);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [category, setCategory] = useState<'all' | 'shape' | 'detail' | 'magic'>('all');
  const [motionId, setMotionId] = useState(p.workshop.motion);
  const [keys, setKeys] = useState<Pose[]>(() => p.workshop.keyframes.length ? p.workshop.keyframes : findMotion(p.workshop.motion).keys.map((k) => ({ ...k, id: keyId() })));
  const [frameCount, setFrameCount] = useState(p.workshop.frameCount);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(p.workshop.motionEnabled);
  const [busy, setBusy] = useState(false);
  const lastRender = useRef(0);
  const selected = parts.find((part) => part.id === selectedPart) || null;
  const baseImage = p.base;
  const animatedEffects = hasAnimatedEffects(effects) || hasAnimatedParts(parts);
  const frameTotal = p.mode === 'animation' && motionEnabled ? frameCount : animatedEffects ? frameCount : 1;
  const effectBase = useMemo(() => renderParts(baseImage, parts), [baseImage, parts]);
  const renderedFrames = useMemo(() => {
    const total = Math.max(1, frameTotal), result: Tex[] = [];
    for (let i = 0; i < total; i++) {
      const t = i / total;
      const pose = p.mode === 'animation' && motionEnabled ? interpolatePose(keys, t) : { id: '', time: t, label: '', angle: 0, x: 0, y: 0, scale: 1 };
      result.push(renderWeaponFrame(baseImage, parts, effects, t, {
        angle: pose.angle, x: Math.round(pose.x * Math.max(1, baseImage.w / 16)), y: Math.round(pose.y * Math.max(1, baseImage.h / 16)), scale: pose.scale,
      }, p.mode === 'animation' && motionEnabled ? motionId : 'none', i, p.accent));
    }
    if (p.mode === 'animation' && motionEnabled && ['slash', 'combo', 'smash', 'thrust'].includes(motionId) && result.length > 2) {
      const trailColor = hexToRgb(p.accent);
      return result.map((current, i) => i < 1 ? current : G.composite(G.silhouette(result[i - 1], trailColor, 0.18), current));
    }
    return result;
  }, [baseImage, parts, effects, frameTotal, p.mode, motionEnabled, keys, motionId, p.accent]);
  const urls = useMemo(() => renderedFrames.map(texToDataURL), [renderedFrames]);
  const frameIndex = frame % urls.length;
  const currentPose = interpolatePose(keys, frameIndex / Math.max(1, frameTotal));
  const partCatalog = useMemo(() => PART_LIBRARY.filter((part) => category === 'all' || part.material === category), [category]);

  useEffect(() => {
    if (!p.active || !playing || urls.length < 2) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % urls.length), 1000 / p.fps);
    return () => clearInterval(id);
  }, [p.active, playing, urls.length, p.fps]);
  useEffect(() => {
    if (!p.active) return;
    p.onWorkshopChange({ parts, effects, motion: motionId, keyframes: keys, frameCount, motionEnabled });
  }, [p.active, p.onWorkshopChange, parts, effects, motionId, keys, frameCount, motionEnabled]);
  useEffect(() => { if (p.active) lastRender.current++; }, [p.active, parts, effects, keys]);

  const addPart = (kind: PartKind) => {
    if (parts.length >= 48) { p.onNotify('パーツは48個まで追加できます。', true); return; }
    const next = createPart(kind);
    setParts((all) => [...all, next]); setSelectedPart(next.id);
  };
  const updatePart = (id: string, patch: Partial<PartLayer>) => setParts((all) => all.map((part) => part.id === id ? { ...part, ...patch } : part));
  const deletePart = (id: string) => { setParts((all) => all.filter((part) => part.id !== id)); if (selectedPart === id) setSelectedPart(null); };
  const movePart = (from: number, to: number) => setParts((all) => { if (to < 0 || to >= all.length) return all; const next = [...all], [item] = next.splice(from, 1); next.splice(to, 0, item); return next; });
  const duplicatePart = (id: string) => {
    if (parts.length >= 48) { p.onNotify('パーツは48個まで追加できます。', true); return; }
    const old = parts.find((part) => part.id === id); if (!old) return;
    const next = { ...copyPart(old), name: `${old.name} コピー` };
    setParts((all) => [...all, next]); setSelectedPart(next.id);
  };
  const setPartPatch = (id: string, patch: Partial<PartLayer>) => updatePart(id, patch);

  const addEffect = (type: string) => {
    if (effects.length >= 32) { p.onNotify('エフェクトは32レイヤーまで追加できます。', true); return; }
    const layer = newLayer(type, smartParams(type, effectBase));
    setEffects((all) => [...all, layer]); setSelectedEffect(layer.id);
  };
  const changeEffect = (id: string, patch: Partial<Layer>, _key?: string) => setEffects((all) => all.map((layer) => layer.id === id ? { ...layer, ...patch } : layer));
  const removeEffect = (id: string) => { setEffects((all) => all.filter((layer) => layer.id !== id)); if (selectedEffect === id) setSelectedEffect(null); };
  const moveEffect = (from: number, to: number) => setEffects((all) => { if (to < 0 || to >= all.length) return all; const next = [...all], [layer] = next.splice(from, 1); next.splice(to, 0, layer); return next; });
  const duplicateEffect = (id: string) => {
    if (effects.length >= 32) { p.onNotify('エフェクトは32レイヤーまで追加できます。', true); return; }
    const index = effects.findIndex((layer) => layer.id === id), source = effects[index]; if (!source) return;
    const clone = { ...source, id: newLayer(source.type).id, params: { ...source.params } };
    setEffects((all) => { const next = [...all]; next.splice(index + 1, 0, clone); return next; }); setSelectedEffect(clone.id);
  };
  const changePose = (id: string, patch: Partial<Pose>) => setKeys((all) => all.map((key) => key.id === id ? { ...key, ...patch } : key));
  const selectMotion = (id: string) => {
    setMotionId(id); setKeys(findMotion(id).keys.map((key) => ({ ...key, id: keyId() }))); setFrame(0);
  };
  const addKeyframe = () => {
    if (keys.length >= 16) { p.onNotify('1モーションは16キーフレームまでです。', true); return; }
    const time = frameIndex / Math.max(1, frameTotal - 1), near = interpolatePose(keys, time);
    const existing = keys.find((key) => Math.abs(key.time - time) < 0.025);
    if (existing) { setSelectedPart(existing.id); p.onNotify('再生位置にすでにキーフレームがあります。'); return; }
    const next: Pose = { ...near, id: keyId(), time, label: '追加ポーズ' };
    setKeys((all) => [...all, next].sort((a, b) => a.time - b.time)); setSelectedPart(next.id);
  };
  const deleteKeyframe = (id: string) => {
    if (keys.length <= 2) { p.onNotify('アニメーションには最低2つのキーフレームが必要です。', true); return; }
    setKeys((all) => all.filter((key) => key.id !== id)); if (selectedPart === id) setSelectedPart(null);
  };
  const chooseKeyframe = (key: Pose) => { setSelectedPart(key.id); setFrame(Math.min(frameTotal - 1, Math.round(key.time * (frameTotal - 1)))); setPlaying(false); };

  const outputFrames = renderedFrames.length > 1 ? renderedFrames : [renderedFrames[0]];
  const downloadAnimation = async () => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      const baseName = (p.name || 'weapon').replace(/[^a-z\d_.-]/gi, '_');
      if (outputFrames.length === 1) download(texToDataURL(outputFrames[0]), `${baseName}_assembled.png`);
      else {
        const data = texToDataURL(stackVertical(outputFrames));
        const bytes = Uint8Array.from(atob(data.split(',')[1]), (char) => char.charCodeAt(0));
        const files: Zippable = {
          [`${baseName}_animation.png`]: [bytes, { level: 0 as const }],
          [`${baseName}_animation.png.mcmeta`]: strToU8(JSON.stringify({ animation: { width: outputFrames[0].w, height: outputFrames[0].h, frametime: Math.max(1, Math.round(20 / p.fps)), interpolate: false } }, null, 2)),
        };
        const archive = zipSync(files);
        downloadBlob(new Blob([new Uint8Array(archive)], { type: 'application/zip' }), `${baseName}_animation.zip`);
      }
      p.onNotify(outputFrames.length > 1 ? `${outputFrames.length}フレームのアニメーションを書き出しました。` : '合成テクスチャを書き出しました。');
    } catch { p.onNotify('書き出せませんでした。解像度を下げてお試しください。', true); }
    finally { setBusy(false); }
  };
  const openInEditor = () => {
    setPlaying(false);
    p.onOpen(outputFrames, `workshop_${modeSuffix(p.mode)}`, modeLabel(p.mode));
  };

  if (!p.active) return <div hidden />;
  const activePart = selected;
  const positionablePart = activePart && ['crossguard', 'gem', 'pommel', 'charm', 'edge-inlay', 'ghost-wings'].includes(activePart.type);
  const offsettablePart = activePart && ['crossguard', 'gem', 'pommel', 'charm', 'ghost-wings'].includes(activePart.type);
  const colorablePart = activePart && !['blade-length', 'blade-width', 'second-blade'].includes(activePart.type);
  const rotatablePart = activePart && ['crossguard', 'pommel', 'charm', 'ghost-wings'].includes(activePart.type);
  const activeKey = p.mode === 'animation' ? keys.find((key) => key.id === selectedPart) : null;

  return <section className={`weapon-workshop ww-${p.mode}`}>
    <div className="ww-top">
      <div className="ww-preview-panel">
        <div className="ww-preview-toolbar"><span><span className="live-dot" /> リアルタイムプレビュー</span><span>{baseImage.w} × {baseImage.h} px</span></div>
        <div className="ww-preview checker"><img src={urls[frameIndex]} alt="組み立てた武器のプレビュー" /></div>
        <div className="ww-preview-footer"><span>{parts.filter((part) => part.enabled).length} パーツ <span>·</span> {effects.filter((layer) => layer.enabled).length} エフェクト</span>
          <div><button className="secondary-button" onClick={downloadAnimation} disabled={busy}>{busy ? <LoaderCircle size={13} className="spin" /> : <Download size={13} />}{outputFrames.length > 1 ? ' PNG + mcmeta' : ' PNG'}</button><button className="primary-button" onClick={openInEditor} disabled={busy}><WandSparkles size={13} /> エディターへ</button></div></div>
      </div>

      {p.mode === 'parts' && <aside className="ww-inspector">
        <div className="ww-section-title"><div><h3>組み立てパーツ</h3><small>{parts.length} / 48 layers</small></div><button className="icon-button" disabled={!parts.length} onClick={() => { setParts([]); setSelectedPart(null); }} title="すべてのパーツを削除"><Trash2 size={14} /></button></div>
        <div className="ww-part-list">{!parts.length && <div className="ww-empty"><Layers size={18} /><span>パーツを追加して<br />武器を組み立てる</span></div>}
          {parts.map((part) => <div key={part.id} className={`ww-part-row ${part.id === selectedPart ? 'selected' : ''}`} onClick={() => setSelectedPart(part.id)}>
            <GripVertical size={12} /><span className="ww-part-color" style={{ background: part.color }} /><span className="ww-part-name">{part.name}</span><button className="icon-button" aria-label={part.enabled ? 'パーツを隠す' : 'パーツを表示'} onClick={(e) => { e.stopPropagation(); updatePart(part.id, { enabled: !part.enabled }); }}>{part.enabled ? <Eye size={13} /> : <EyeOff size={13} />}</button><button className="icon-button" aria-label="パーツを削除" onClick={(e) => { e.stopPropagation(); deletePart(part.id); }}><X size={13} /></button></div>)}
        </div>
        {activePart && <div className="ww-part-props">
          <div className="ww-property-heading"><span>パーツ設定</span><div><button className="icon-button" title="上に移動" onClick={() => movePart(parts.findIndex((x) => x.id === activePart.id), parts.findIndex((x) => x.id === activePart.id) - 1)}><ArrowUp size={13} /></button><button className="icon-button" title="下に移動" onClick={() => movePart(parts.findIndex((x) => x.id === activePart.id), parts.findIndex((x) => x.id === activePart.id) + 1)}><ArrowDown size={13} /></button><button className="icon-button" title="複製" onClick={() => duplicatePart(activePart.id)}><Copy size={13} /></button></div></div>
          {colorablePart && <label className="ww-color-control"><span>色</span><span className="color-control"><span className="color-chip" style={{ background: activePart.color }}><input type="color" aria-label="パーツの色" value={activePart.color} onChange={(e) => setPartPatch(activePart.id, { color: e.target.value })} /></span><code>{activePart.color.toUpperCase()}</code></span></label>}
          <RangeControl label="サイズ" value={activePart.size} min={1} max={10} onChange={(n) => setPartPatch(activePart.id, { size: n })} />
          {positionablePart && <RangeControl label="位置（柄 → 刃先）" value={activePart.position} min={-15} max={115} unit="%" onChange={(n) => setPartPatch(activePart.id, { position: n })} />}
          {offsettablePart && <RangeControl label="軸からのずれ" value={activePart.offset} min={-8} max={8} unit="px" onChange={(n) => setPartPatch(activePart.id, { offset: n })} />}
          {rotatablePart && <RangeControl label="回転" value={activePart.rotation} min={-90} max={90} unit="°" onChange={(n) => setPartPatch(activePart.id, { rotation: n })} />}
          <RangeControl label="不透明度" value={activePart.opacity} min={0} max={100} unit="%" onChange={(n) => setPartPatch(activePart.id, { opacity: n })} />
        </div>}
      </aside>}

      {p.mode === 'animation' && <aside className="ww-inspector ww-motion-inspector">
        <div className="ww-section-title"><div><h3>モーション</h3><small>キーフレームで姿勢を補間</small></div><button className={`icon-button ${motionEnabled ? 'active' : ''}`} onClick={() => setMotionEnabled(!motionEnabled)} title="モーションの有効／無効">{motionEnabled ? <Eye size={14} /> : <EyeOff size={14} />}</button></div>
        <div className="ww-motion-presets">{MOTIONS.map((motion) => <button key={motion.id} title={motion.desc} className={motion.id === motionId ? 'selected' : ''} onClick={() => { setMotionId(motion.id); setKeys(findMotion(motion.id).keys.map((k) => ({ ...k, id: keyId() }))); setFrame(0); setPlaying(false); }}><span>{motion.name}</span><small>{motion.keys.length} keys</small></button>)}</div>
        <div className="ww-motion-controls"><label className="inline-control"><span>出力フレーム</span><select value={frameCount} onChange={(e) => { setFrameCount(Number(e.target.value)); setFrame(0); }}>{[4, 6, 8, 12, 16, 24, 32].map((n) => <option key={n} value={n}>{n} frames</option>)}</select></label>
          <div className="ww-motion-info"><span>選択中</span><strong>{currentPose.label || 'キーフレーム'}</strong></div>
          {activeKey && <div className="ww-key-properties"><label className="inline-control"><span>名前</span><input aria-label="キーフレーム名" maxLength={16} value={activeKey.label} onChange={(e) => changePose(activeKey.id, { label: e.target.value })} /></label>
            <RangeControl label="タイミング" value={Math.round(activeKey.time * 100)} min={0} max={100} unit="%" onChange={(n) => changePose(activeKey.id, { time: n / 100 })} />
            <RangeControl label="角度" value={activeKey.angle} min={-180} max={180} unit="°" onChange={(n) => changePose(activeKey.id, { angle: n })} />
            <RangeControl label="移動 X" value={activeKey.x} min={-8} max={8} unit="px" onChange={(n) => changePose(activeKey.id, { x: n })} />
            <RangeControl label="移動 Y" value={activeKey.y} min={-8} max={8} unit="px" onChange={(n) => changePose(activeKey.id, { y: n })} />
            <RangeControl label="拡大率" value={activeKey.scale} min={0.5} max={1.15} step={0.05} unit="×" onChange={(n) => changePose(activeKey.id, { scale: n })} />
            <button className="secondary-button ww-delete-key" disabled={keys.length <= 2} onClick={() => deleteKeyframe(activeKey.id)}><Trash2 size={13} /> キーフレームを削除</button>
          </div>}
          {!activeKey && <p className="ww-hint">タイムラインのダイヤを選んでポーズを調整。＋で再生位置のポーズを追加。</p>}
        </div>
      </aside>}

      {p.mode === 'effects' && <aside className="ww-inspector ww-effects-inspector">
        <div className="ww-section-title"><div><h3>エフェクトスタック</h3><small>{effects.length} / 32 layers</small></div><button className="icon-button" disabled={!effects.length} onClick={() => { setEffects([]); setSelectedEffect(null); }} title="すべて削除"><Trash2 size={14} /></button></div>
        <div className="ww-effects-scroll"><LayerPanel layers={effects} selected={selectedEffect} onSelect={setSelectedEffect} onChange={changeEffect} onMove={moveEffect} onRemove={removeEffect} onDuplicate={duplicateEffect} /></div>
      </aside>}
    </div>

    {p.mode === 'parts' && <section className="ww-catalog"><div className="ww-catalog-heading"><div><h3>パーツを追加</h3><span>クリックして積み重ねる · 重ね順は右のリストで変更</span></div><div className="ww-category-tabs">{([['all', 'すべて'], ['shape', 'シルエット'], ['detail', '装飾'], ['magic', '魔法']] as const).map(([id, label]) => <button className={category === id ? 'selected' : ''} key={id} onClick={() => setCategory(id)}>{label}</button>)}</div></div><div className="ww-part-catalog">{partCatalog.map((part) => <button key={part.type} className="ww-part-tile" title={part.desc} onClick={() => addPart(part.type)}><span className={`ww-part-swatch ${part.material}`}><span style={{ background: part.color }} /><Plus size={13} /></span><span><strong>{part.name}</strong><small>{part.desc}</small></span></button>)}</div></section>}

    {p.mode === 'animation' && <section className="ww-timeline">
      <div className="ww-timeline-toolbar"><div><button className={`timeline-play ${playing ? 'playing' : ''}`} onClick={() => setPlaying(!playing)} aria-label={playing ? '一時停止' : '再生'}>{playing ? <Pause size={14} /> : <Play size={14} />}</button><button className="timeline-play" onClick={() => setFrame((frame - 1 + frameTotal) % frameTotal)} title="前フレーム"><ArrowUp size={13} /></button><button className="timeline-play" onClick={() => setFrame((frame + 1) % frameTotal)} title="次フレーム"><ArrowDown size={13} /></button></div><span className="timeline-position">FRAME <strong>{String(frameIndex + 1).padStart(2, '0')}</strong> / {String(frameTotal).padStart(2, '0')} <span>·</span> {currentPose.angle.toFixed(0)}°</span><button className="secondary-button" disabled={keys.length >= 16} onClick={addKeyframe}><Plus size={13} /> 現在位置にキーを追加</button><button className="text-button" onClick={() => selectMotion(motionId)}><RotateCcw size={13} /> リセット</button></div>
      <input className="ww-scrubber" aria-label="アニメーションタイムライン" type="range" min={0} max={frameTotal - 1} value={frameIndex} onChange={(e) => { setFrame(Number(e.target.value)); setPlaying(false); }} />
      <div className="ww-filmstrip">{urls.map((url, i) => <button key={i} className={`ww-film-frame ${i === frameIndex ? 'selected' : ''}`} onClick={() => { setFrame(i); setPlaying(false); }}><img src={url} alt={`フレーム ${i + 1}`} /><small>{String(i + 1).padStart(2, '0')}</small>{keys.some((k) => Math.round(k.time * (frameTotal - 1)) === i) && <span className="key-mark" />}</button>)}</div>
      <div className="ww-key-row"><span>KEY POSES</span>{[...keys].sort((a, b) => a.time - b.time).map((key) => <button key={key.id} className={`ww-key-chip ${key.id === selectedPart ? 'selected' : ''}`} style={{ left: `${key.time * 100}%` }} onClick={() => chooseKeyframe(key)} title={`${key.label} · ${Math.round(key.time * 100)}%`}><i />{key.label}</button>)}</div>
    </section>}

    {p.mode === 'effects' && <section className="ww-effect-library"><EffectLibrary base={effectBase} onAdd={addEffect} full /></section>}

    <footer className="ww-footer"><span><Move size={12} /> {p.mode === 'parts' ? '各パーツは個別に移動・回転・色・不透明度を調整できます' : p.mode === 'animation' ? 'ポーズ間はスムーズ補間。キーフレームと全フレームを個別出力できます' : '複数のエフェクトを積み重ね、レイヤーごとに調整できます'}</span><span><Check size={12} /> ブラウザー内で非破壊合成</span></footer>
  </section>;
}

function modeSuffix(mode: WorkshopMode) { return mode === 'parts' ? 'assembled' : mode === 'animation' ? 'animation' : 'effects'; }
function modeLabel(mode: WorkshopMode) { return mode === 'parts' ? 'パーツ合成' : mode === 'animation' ? 'キーフレームアニメ' : '追加エフェクト'; }