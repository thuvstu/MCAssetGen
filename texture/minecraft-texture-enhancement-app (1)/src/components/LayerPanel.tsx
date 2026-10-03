import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Copy, Dices, Eye, EyeOff, GripVertical, Layers, RotateCcw, Trash2 } from 'lucide-react';
import { EFFECT_MAP, Layer, ParamDef, defaultParams, isLayerAnimated } from '../lib/effects';
import { EffectIcon } from './Icons';

interface Props {
  layers: Layer[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<Layer>, key?: string) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function RangeControl({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }: {
  label: string; value: number; min?: number; max?: number; step?: number; unit?: string; onChange: (n: number) => void;
}) {
  const percent = (value - min) / (max - min) * 100;
  return <label className="range-control">
    <span className="control-heading"><span>{label}</span><span className="value-box">{Number(value.toFixed(2))}<small>{unit}</small></span></span>
    <input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
      style={{ background: `linear-gradient(to right, var(--accent) ${percent}%, #3b403e ${percent}%)` }} />
  </label>;
}

export function ParamControl({ def, value, onChange }: { def: ParamDef; value: string | number | boolean; onChange: (v: string | number | boolean) => void }) {
  if (def.type === 'range') return <RangeControl label={def.label} value={Number(value)} min={def.min} max={def.max} step={def.step} onChange={onChange} />;
  if (def.type === 'color') return <label className="inline-control">
    <span>{def.label}</span><span className="color-control"><span className="color-chip" style={{ background: String(value) }}><input aria-label={def.label} type="color" value={String(value)} onChange={(e) => onChange(e.target.value)} /></span><span>{String(value).toUpperCase()}</span></span>
  </label>;
  if (def.type === 'select') return <label className="inline-control"><span>{def.label}</span>
    <select aria-label={def.label} value={String(value)} onChange={(e) => onChange(e.target.value)}>{def.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
  </label>;
  return <div className="inline-control"><span>{def.label}</span><button type="button" role="switch" aria-checked={Boolean(value)} aria-label={def.label} className={`toggle ${value ? 'on' : ''}`} onClick={() => onChange(!value)}><span /></button></div>;
}

export default function LayerPanel(p: Props) {
  const [drag, setDrag] = useState<number | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const current = p.layers.find((l) => l.id === p.selected);
  const currentIndex = p.layers.findIndex((l) => l.id === p.selected);
  const definition = current ? EFFECT_MAP[current.type] : null;
  const mainParams = definition?.params.filter((d) => definition.id !== 'glow' || ['color', 'intensity', 'radius'].includes(d.key)) || [];
  const moreParams = definition?.params.filter((d) => !mainParams.includes(d)) || [];
  return <>
    <div className="layer-list">
      {!p.layers.length && <div className="empty-state"><Layers size={26} /><strong>自由に、重ねよう。</strong><p>下のライブラリからエフェクトを追加してください。</p></div>}
      {p.layers.map((l, i) => ({ l, i })).reverse().map(({ l, i }) => {
        const def = EFFECT_MAP[l.type];
        if (!def) return null;
        return <div key={l.id} className={`layer-row ${p.selected === l.id ? 'selected' : ''} ${l.enabled ? '' : 'muted'}`}
          role="button" tabIndex={0} aria-label={`${def.name}の設定`} aria-pressed={p.selected === l.id}
          onClick={() => p.onSelect(l.id)} onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); p.onSelect(l.id); } }}
          draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(i)); e.dataTransfer.effectAllowed = 'move'; setDrag(i); }}
          onDragEnd={() => setDrag(null)} onDragOver={(e) => { if (drag !== null) e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); if (drag !== null && drag !== i) p.onMove(drag, i); setDrag(null); }}>
          <GripVertical size={12} className="drag-handle" /><span className="layer-icon"><EffectIcon type={l.type} /></span><span className="layer-name">{def.name}</span>
          {isLayerAnimated(l) && <span className="animated-dot" title="アニメーション効果" />}
          <button className="icon-button visibility-button" title={l.enabled ? 'エフェクトを非表示' : 'エフェクトを表示'} aria-label={`${def.name}を${l.enabled ? '非表示' : '表示'}`} onClick={(e) => { e.stopPropagation(); p.onChange(l.id, { enabled: !l.enabled }); }}>{l.enabled ? <Eye size={15} /> : <EyeOff size={15} />}</button>
        </div>;
      })}
    </div>
    {current && definition && <section className="properties" key={current.id}>
      <div className="section-heading"><h3>プロパティ</h3><button className="icon-button" title="設定をリセット" aria-label="設定をリセット" onClick={() => p.onChange(current.id, { params: defaultParams(definition), opacity: 100, blend: 'normal' })}><RotateCcw size={14} /></button></div>
      <div className="property-controls">
        <RangeControl label="不透明度" value={current.opacity} unit="%" onChange={(n) => p.onChange(current.id, { opacity: n }, `${current.id}-opacity`)} />
        <div className="property-divider" />
        {mainParams.map((def) => <ParamControl key={def.key} def={def} value={current.params[def.key] ?? def.default}
          onChange={(value) => p.onChange(current.id, { params: { ...current.params, [def.key]: value } }, `${current.id}-${def.key}`)} />)}
        {current.type === 'upscale' && <p className="field-note">出力サイズは最大128pxです。</p>}
        <button className="advanced-toggle" onClick={() => setAdvanced(!advanced)}>詳細設定 <ChevronDown size={13} style={{ transform: advanced ? 'rotate(180deg)' : undefined }} /></button>
        {advanced && <div className="advanced-controls">
          {moreParams.map((def) => <ParamControl key={def.key} def={def} value={current.params[def.key] ?? def.default}
            onChange={(value) => p.onChange(current.id, { params: { ...current.params, [def.key]: value } }, `${current.id}-${def.key}`)} />)}
          <label className="inline-control"><span>合成モード</span><select value={current.blend || 'normal'} onChange={(e) => p.onChange(current.id, { blend: e.target.value as Layer['blend'] })}>
            <option value="normal">通常</option><option value="multiply">乗算</option><option value="screen">スクリーン</option><option value="overlay">オーバーレイ</option><option value="add">加算</option>
          </select></label>
          <p className="field-note">{definition.desc}</p>
          <button className="secondary-button" onClick={() => p.onChange(current.id, { seed: Math.floor(Math.random() * 99999) })}><Dices size={14} /> 模様をランダムに変更</button>
        </div>}
      </div>
      <div className="layer-actions"><span>レイヤー操作</span><button className="icon-button" title="上へ移動" aria-label="上へ移動" disabled={currentIndex === p.layers.length - 1} onClick={() => p.onMove(currentIndex, currentIndex + 1)}><ArrowUp size={14} /></button><button className="icon-button" title="下へ移動" aria-label="下へ移動" disabled={currentIndex === 0} onClick={() => p.onMove(currentIndex, currentIndex - 1)}><ArrowDown size={14} /></button><button className="icon-button" title="複製" aria-label="レイヤーを複製" onClick={() => p.onDuplicate(current.id)}><Copy size={14} /></button><button className="icon-button danger" title="削除" aria-label="レイヤーを削除" onClick={() => p.onRemove(current.id)}><Trash2 size={14} /></button></div>
    </section>}
  </>;
}