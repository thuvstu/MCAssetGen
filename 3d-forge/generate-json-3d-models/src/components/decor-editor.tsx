"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, Copy, Eye, EyeOff, Gem, Layers3, Leaf, Link2, Plus, RotateCcw, Search, Sparkles, Trash2, Wand2 } from "lucide-react";
import { ACCENT_COLORS, resolvedColor } from "@/lib/color-textures";
import { DECOR_CATEGORIES, DECOR_OPTIONS, MAX_DECOR, SLOT_OPTIONS, STYLE_PRESETS, decoLabel, makeInstance, normalizeInstance, slotLabel } from "@/lib/decor";
import type { AccentId, DecorId, DecorInstance, Extras, SlotId, Vec3 } from "@/lib/model-types";

interface Props {
  extras: Extras;
  onChange: (patch: Partial<Extras>) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  disabled?: boolean;
}
function Slider({ label, value, min, max, step, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  return <label className="precision-slider"><span>{label}</span><div><input type="range" aria-label={label} min={min} max={max} step={step} value={value} style={{ "--range-progress": `${(value - min) / (max - min) * 100}%` } as CSSProperties} onChange={event => onChange(Number(event.target.value))} /><output>{Number(value.toFixed(2))}{suffix}</output></div></label>;
}

export default function DecorEditor({ extras, onChange, selectedId, onSelect, disabled }: Props) {
  const inspector = useRef<HTMLElement>(null);
  const [category, setCategory] = useState("すべて");
  const [query, setQuery] = useState("");
  const [appendPreset, setAppendPreset] = useState(false);
  const instances = useMemo(() => extras.decor.map((instance, index) => normalizeInstance(instance, index)), [extras.decor]);
  const selected = instances.find(instance => instance.id === selectedId) ?? instances[0];
  const selectedIndex = selected ? instances.findIndex(instance => instance.id === selected.id) : -1;
  useEffect(() => {
    if (!selectedId) return;
    const frame = requestAnimationFrame(() => {
      const element = inspector.current, field = element?.closest("fieldset");
      if (element && field && field.clientHeight > 0) {
        const top = element.getBoundingClientRect().top - field.getBoundingClientRect().top;
        if (top < 0 || top > field.clientHeight - 100) field.scrollTo({ top: field.scrollTop + top - 10, behavior: "instant" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId]);

  const options = DECOR_OPTIONS.filter(option => (category === "すべて" || category === option.category) && `${option.label} ${option.hint}`.includes(query));
  const update = (index: number, patch: Partial<DecorInstance>) => onChange({ decor: instances.map((instance, i) => i === index ? { ...instance, ...patch } : instance) });
  const create = (kind: DecorId) => {
    if (instances.length >= MAX_DECOR) return;
    const instance = normalizeInstance({ ...makeInstance(kind), id: crypto.randomUUID(), count: 1 }, instances.length);
    onChange({ decor: [...instances, instance] }); onSelect(instance.id!);
  };
  const remove = (index: number) => {
    const next = instances.filter((_, i) => i !== index);
    onChange({ decor: next });
    if (instances[index].id === selected?.id) onSelect(next[Math.min(index, next.length - 1)]?.id ?? null);
  };
  const duplicate = (index: number) => {
    if (instances.length >= MAX_DECOR) return;
    const origin = instances[index];
    const copied = { ...origin, id: crypto.randomUUID(), offset: [...origin.offset!] as Vec3 };
    copied.offset[0] = Math.min(8, copied.offset[0] + 1.5);
    onChange({ decor: [...instances.slice(0, index + 1), copied, ...instances.slice(index + 1)] }); onSelect(copied.id);
  };
  const move = (direction: number) => {
    const target = selectedIndex + direction;
    if (target < 0 || target >= instances.length) return;
    const next = [...instances]; [next[selectedIndex], next[target]] = [next[target], next[selectedIndex]]; onChange({ decor: next });
  };
  const changeOffset = (axis: number, value: number) => {
    if (!selected) return;
    const next = [...selected.offset!] as Vec3; next[axis] = value; update(selectedIndex, { offset: next });
  };
  const applyPreset = (id: string) => {
    const preset = STYLE_PRESETS.find(option => option.id === id)!;
    const added = preset.decor.map((instance, index) => normalizeInstance({ ...instance, id: crypto.randomUUID() }, index));
    const decor = appendPreset ? [...instances, ...added].slice(0, MAX_DECOR) : added;
    onChange({ decor, accent: preset.accent, effect: preset.defaultEffect }); onSelect(added[0]?.id ?? null);
  };
  const effectiveColor = selected ? resolvedColor(selected.color) ?? resolvedColor(extras.accent) ?? "#c7a4ff" : "#c7a4ff";

  return <div className="decoration-editor" aria-label="装飾エディター">
    <div className="editor-intro"><span className="editor-intro-icon"><Gem size={19} /></span><div><h3>小さなディテール、大きな個性。</h3><p>足して、重ねて、好きな場所へ。</p></div></div>
    <details className="preset-drawer"><summary><Wand2 size={14} />スタイルから始める<span>13 PRESETS</span><ChevronDown size={12} /></summary>
      <div className="preset-drawer-body"><label className="append-preset"><input type="checkbox" checked={appendPreset} onChange={event => setAppendPreset(event.target.checked)} />いまの装飾に追加する</label><div className="preset-mini-grid">{STYLE_PRESETS.map(preset => <button type="button" key={preset.id} title={preset.desc} disabled={disabled || appendPreset && instances.length >= MAX_DECOR} onClick={() => applyPreset(preset.id)}><i style={{ background: preset.swatch }} />{preset.label}</button>)}</div><p>プリセットの装飾も、ひとつずつ自由に編集できます。</p></div>
    </details>
    <div className="decor-catalog-head"><span>装飾を追加</span><small>21 OBJECTS</small></div>
    <div className="decor-search"><Search size={13} /><input aria-label="装飾を検索" value={query} onChange={event => setQuery(event.target.value)} placeholder="宝石、鎖、ルーン…" /></div>
    <div className="decor-category-nav" role="group" aria-label="装飾カテゴリ">{["すべて", ...DECOR_CATEGORIES].map(cat => <button type="button" key={cat} aria-pressed={category === cat} className={category === cat ? "selected" : ""} onClick={() => setCategory(cat)}>{cat}</button>)}</div>
    <div className="decor-catalog" role="group" aria-label="装飾を追加">{options.map(option => {
      const copies = instances.filter(instance => instance.kind === option.id).length;
      const Icon = option.category === "自然" ? Leaf : option.category === "魔法" ? Sparkles : ["chains", "rings"].includes(option.id) ? Link2 : Gem;
      return <button type="button" className="catalog-item" key={option.id} title={option.hint} aria-label={`${option.label}を追加`} disabled={disabled || instances.length >= MAX_DECOR} onClick={() => create(option.id)} style={{ "--item-color": option.swatch ?? "#ad8bd7" } as CSSProperties}><span className="catalog-icon"><Icon size={17} strokeWidth={1.5} /></span><span>{option.label}</span>{copies ? <b>{copies}</b> : <Plus size={11} className="catalog-add" />}</button>;
    })}</div>
    {!options.length && <p className="catalog-empty">該当する装飾がありません。</p>}
    {instances.length >= MAX_DECOR && <p className="catalog-empty">配置できる装飾は30パーツまでです。</p>}

    <div className="layer-list-heading"><span><Layers3 size={13} />配置済みパーツ</span><small>{instances.length.toString().padStart(2, "0")} / 30</small></div>
    {!instances.length ? <div className="layers-empty"><Plus size={20} strokeWidth={1.3} /><strong>最初の装飾を追加しよう</strong><p>上のカタログをクリック。<br />同じ種類も何度でも配置できます。</p></div> : <div className="decor-layer-list" role="list" aria-label="配置済み装飾">{instances.map((instance, index) => <div key={instance.id} role="listitem" data-instance-id={instance.id} className={`decor-layer ${selected?.id === instance.id ? "is-selected" : ""} ${instance.visible === false ? "is-hidden" : ""}`}>
      <button type="button" className="layer-select" aria-label={`${decoLabel(instance.kind)} ${index + 1} を編集`} aria-pressed={selected?.id === instance.id} onClick={() => onSelect(instance.id!)}><i style={{ background: resolvedColor(instance.color) ?? resolvedColor(extras.accent) ?? "#a788c9" }} /><span><strong>{decoLabel(instance.kind)} <em>{String(index + 1).padStart(2, "0")}</em></strong><small>{slotLabel(instance.slot)} · {instance.count}個{instance.mirror ? " × 左右" : ""}</small></span></button>
      <div className="layer-actions"><button type="button" title="表示を切り替え" aria-label={`${decoLabel(instance.kind)} ${index + 1} を${instance.visible === false ? "表示" : "非表示"}`} onClick={() => update(index, { visible: !instance.visible })}>{instance.visible === false ? <EyeOff size={13} /> : <Eye size={13} />}</button><button type="button" title="複製" aria-label={`${decoLabel(instance.kind)} ${index + 1} を複製`} disabled={instances.length >= MAX_DECOR} onClick={() => duplicate(index)}><Copy size={12} /></button><button type="button" className="layer-delete" title="削除" aria-label={`${decoLabel(instance.kind)} ${index + 1} を削除`} onClick={() => remove(index)}><Trash2 size={12} /></button></div>
    </div>)}</div>}

    {selected && <section ref={inspector} className="part-inspector" aria-label="選択パーツの設定" key={selected.id}>
      <header><span><SlidersIcon />{decoLabel(selected.kind)}の設定</span><div><button type="button" title="順番を上へ" aria-label="パーツを上に移動" disabled={selectedIndex === 0} onClick={() => move(-1)}><ArrowUp size={12} /></button><button type="button" title="順番を下へ" aria-label="パーツを下に移動" disabled={selectedIndex === instances.length - 1} onClick={() => move(1)}><ArrowDown size={12} /></button><button type="button" title="位置・サイズをリセット" aria-label="装飾の配置をリセット" onClick={() => update(selectedIndex, { offset: [0,0,0], size: 1, spacing: 1, mirror: false })}><RotateCcw size={12} /></button></div></header>
      <label className="inspector-select"><span>取り付け場所</span><select aria-label="装飾の配置場所" value={selected.slot} onChange={event => update(selectedIndex, { slot: event.target.value as SlotId })}>{SLOT_OPTIONS.map(slot => <option key={slot.id} value={slot.id}>{slot.label}</option>)}</select></label>
      <Slider label="装飾の個数" value={selected.count!} min={1} max={12} step={1} suffix=" 個" onChange={count => update(selectedIndex, { count })} />
      <Slider label="装飾の大きさ" value={selected.size! * 100} min={25} max={200} step={5} suffix="%" onChange={size => update(selectedIndex, { size: size / 100 })} />
      <div className="inspector-group-title">位置を微調整 <small>モデル基準 / unit</small></div>
      <div className="axis-inputs">{["X", "Y", "Z"].map((axis, index) => <label key={axis} data-axis={axis}><span>{axis}</span><input aria-label={`装飾の位置 ${axis}`} type="number" min={-8} max={8} step={.25} value={selected.offset![index]} onChange={event => { const number = Number(event.target.value); if (Number.isFinite(number)) changeOffset(index, Math.max(-8, Math.min(8, number))); }} /></label>)}</div>
      <div className="position-presets"><button type="button" onClick={() => changeOffset(0, Math.max(-8, selected.offset![0] - .5))}>← 左へ</button><button type="button" onClick={() => changeOffset(0, Math.min(8, selected.offset![0] + .5))}>右へ →</button><button type="button" onClick={() => changeOffset(1, Math.min(8, selected.offset![1] + .5))}>↑ 上へ</button><button type="button" onClick={() => changeOffset(1, Math.max(-8, selected.offset![1] - .5))}>↓ 下へ</button></div>
      <label className="mirror-control"><input type="checkbox" aria-label="左右対称にも配置" checked={selected.mirror!} onChange={event => update(selectedIndex, { mirror: event.target.checked })} /><span>左右対称にも配置</span><small>X軸反転</small></label>
      <div className="inspector-group-title">このパーツの色 <small>書き出しにも反映</small></div>
      <div className="part-colors" role="group" aria-label="装飾の個別色">{Object.entries(ACCENT_COLORS).map(([id, option]) => <button key={id} type="button" title={option.label} aria-label={`装飾色 ${option.label}`} aria-pressed={(selected.color ?? "auto") === id} onClick={() => update(selectedIndex, { color: id === "auto" ? null : id as AccentId })} style={{ background: option.color ?? "linear-gradient(135deg,#9678b0,#302139)" }}>{(selected.color ?? "auto") === id && <Check size={12} />}</button>)}<label className="custom-color" title="自由な色を選ぶ"><input type="color" aria-label="装飾のカスタム色" value={effectiveColor} onChange={event => update(selectedIndex, { color: event.target.value as `#${string}` })} /><Plus size={12} /></label></div>
      <div className="inspector-color-value"><span style={{ background: effectiveColor }} /><code>{effectiveColor.toUpperCase()}</code>{!selected.color || selected.color === "auto" ? <small>全体の差し色を継承</small> : <button type="button" onClick={() => update(selectedIndex, { color: null })}>継承に戻す</button>}</div>
      <button type="button" className="back-to-catalog" onClick={() => inspector.current?.closest("fieldset")?.scrollTo({ top: 0, behavior: "smooth" })}><Plus size={12} />別の装飾を追加する</button><p className="inspector-hint">プレビューの装飾をクリックしても選択できます。位置は手持ち用の傾きを付ける前の座標です。</p>
    </section>}
  </div>;
}
function SlidersIcon() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M2 4h12M2 11h12" /><rect x="4" y="2" width="3" height="4" rx="1" fill="#221a2c" /><rect x="9" y="9" width="3" height="4" rx="1" fill="#221a2c" /></svg>; }
