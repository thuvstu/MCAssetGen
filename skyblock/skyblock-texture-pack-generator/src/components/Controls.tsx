import { useState, type CSSProperties, type ReactNode } from 'react';
import { ARCHES, SLOT_LABEL, type Adornment, type ArchId, type Slot, type PartTransform } from '../lib/archetypes';
import { mergeDesignParts, nativePixelUnit, nudgeCanvas, resetDesignTransform, splitDesignPart, updatePartTransform } from '../lib/designOps';
import { MATERIALS, buildRamp, type MatId, type Kind } from '../lib/materials';
import { ESSENCE, LEGACY_FINDING, type PackId, type StyleParams } from '../lib/essence';
import { RARITIES, BASE_ITEMS, type CatItem, type RarityId } from '../lib/catalog';
import type { Anim, Motion } from '../lib/engine';
import { hex } from '../lib/color';
import { THEMES } from '../lib/forgeThemes';
import { DEFAULT_GRAD, type GradMode } from '../lib/gradient';

const ANIMS: { v: Anim; t: string }[] = [
  { v: 'none', t: '静止' }, { v: 'shimmer', t: '閃光' }, { v: 'pulse', t: '脈動' }, { v: 'flow', t: '流動' }, { v: 'twinkle', t: '瞬き' },
  { v: 'flame', t: '炎' }, { v: 'embers', t: '火の粉' }, { v: 'orbit', t: '周回' }, { v: 'arcane', t: '秘術陣' },
  { v: 'lightning', t: '雷脈' }, { v: 'frost', t: '霜華' }, { v: 'aurora', t: '極光' }, { v: 'water', t: '水紋' },
  { v: 'chain', t: 'チェーン' }, { v: 'muzzle', t: '銃火' }, { v: 'charge', t: 'チャージ' }, { v: 'drip', t: '滴り' },
  { v: 'shockwave', t: '衝撃波' }, { v: 'enchant', t: '付与文' }, { v: 'smoke', t: '煙' },
  { v: 'glitch', t: 'グリッチ' }, { v: 'scan', t: '走査線' }, { v: 'sparks', t: '火花' },
];

const GRADS: { v: GradMode; t: string }[] = [
  { v: 'shaded', t: 'なし' }, { v: 'linear', t: '直線' }, { v: 'diagonal', t: '斜め' }, { v: 'radial', t: '放射' },
  { v: 'vignette', t: '周辺' }, { v: 'split', t: '分割' }, { v: 'band', t: '帯' }, { v: 'ripple', t: '波紋' }, { v: 'sweep', t: '縁取' },
];
const KIND_JP: Record<Kind, string> = { metal: '金属', gem: '宝石', wood: '木材', cloth: '布・革', bone: '骨', energy: '霊気', stone: '石', string: '糸' };
const SLOTS: Slot[] = ['main', 'trim', 'grip', 'gem', 'aura'];

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="border-b border-white/8 px-4 py-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-[10px] font-black tracking-[0.22em] text-gold">{title}</h3>
        {note && <span className="text-right font-mono text-[9px] text-mist">{note}</span>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <label className="group block select-none">
      <div className="flex items-baseline justify-between">
        <span className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-mist group-hover:text-gold">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-bone">{fmt ? fmt(value) : value.toFixed(2)}</span>
      </div>
      <input type="range" className="fx" style={{ '--p': `${p}%` } as CSSProperties} min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </label>
  );
}

function Seg<T extends string | number>({ value, options, onChange, cols }: { value: T; options: { v: T; t: string }[]; onChange: (v: T) => void; cols?: number }) {
  return (
    <div className="grid gap-px bg-white/8 p-px" style={{ gridTemplateColumns: `repeat(${cols ?? options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button key={String(o.v)} onClick={() => onChange(o.v)} className={`px-1 py-1.5 text-[11px] transition-colors ${value === o.v ? 'bg-gold font-bold text-ink' : 'bg-panel text-mist hover:bg-slate hover:text-bone'}`}>
          {o.t}
        </button>
      ))}
    </div>
  );
}

export function Controls({
  pack, setPack, n, setN, work, patch, style, stylePatch, resetStyle, motion, setMotion, light, setLight, onNewDesign, onRandomAll, onTheme,
}: {
  pack: PackId;
  setPack: (p: PackId) => void;
  n: 16 | 32 | 64;
  setN: (n: 16 | 32 | 64) => void;
  work: CatItem;
  patch: (p: Partial<CatItem>) => void;
  style: StyleParams;
  stylePatch: (p: Partial<StyleParams>) => void;
  resetStyle: () => void;
  motion: Motion;
  setMotion: (p: Partial<Motion>) => void;
  light: number;
  setLight: (v: number) => void;
  onNewDesign: () => void;
  onRandomAll: () => void;
  onTheme: (id: string) => void;
}) {
  const A = ARCHES[work.design.arch];
  const setD = (p: Partial<CatItem['design']>) => patch({ design: { ...work.design, ...p } });
  const kinds = Object.keys(KIND_JP) as Kind[];
  const [partChoice, setPartChoice] = useState('');
  const [mergeChoice, setMergeChoice] = useState('');
  const parts = A.build(work.design);
  const partIds = [...new Set(parts.map((p) => p.id))];
  const activePart = partIds.includes(partChoice) ? partChoice : partIds[0] ?? '';
  const part = work.design.partTransforms?.[activePart] ?? {};
  const unit = nativePixelUnit(n);
  const maxOffsetPx = Math.max(1, Math.floor(16 / unit));
  // gradient is an *item* property so a themed item can carry its own mapping;
  // it falls back to the pack's default when the item has none.
  const grad = work.design.grad ?? style.grad ?? DEFAULT_GRAD;
  const setGrad = (p: Partial<typeof grad>) => setD({ grad: { ...grad, ...p } });
  const setPart = (value: PartTransform) => {
    setD(updatePartTransform(work.design, activePart, value));
  };
  const mergeWith = (target: string) => {
    if (!activePart || !target || target === activePart) return;
    setD(mergeDesignParts(work.design, activePart, target));
  };
  const unmerge = () => setD(splitDesignPart(work.design, activePart));
  const transform = (p: Partial<CatItem['design']>) => setD(p);
  const nudge = (dx: number, dy: number) => setD(nudgeCanvas(work.design, n, dx, dy));
  const styleSlider = (key: keyof StyleParams, value: number, min: number, max: number, step: number, label: string, fmt?: (v: number) => string) => (
    <Slider label={label} value={value} min={min} max={max} step={step} fmt={fmt} onChange={(v) => stylePatch({ [key]: v })} />
  );

  return (
    <div className="thin h-full overflow-y-auto border-l border-white/8 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <span className="text-[10px] font-bold tracking-[0.22em] text-gold">FORGE PARAMETERS</span>
        <span className="font-mono text-[10px] text-mist">{n}×{n}</span>
      </div>

      <Section title="実測エッセンス / PACK STYLE" note="実パックの計測値に一致">
        <div className="space-y-1.5">
          {(Object.keys(ESSENCE) as PackId[]).map((id) => {
            const e = ESSENCE[id];
            const on = id === pack;
            return (
              <button key={id} onClick={() => setPack(id)} className={`block w-full border px-2.5 py-2 text-left transition-colors ${on ? 'border-gold bg-gold/10' : 'border-white/10 hover:border-white/25'}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-[12px] font-bold ${on ? 'text-gold' : 'text-bone'}`}>{e.name}</span>
                  <span className="font-mono text-[9px] text-mist">{e.nativeRes}x · {e.icons.toLocaleString()} icons</span>
                </div>
                <div className="mt-1 grid grid-cols-3 gap-1 font-mono text-[9px] text-mist">
                  <span>色数 <b className="text-bone">{e.colors}</b></span>
                  <span>暗輪郭 <b className="text-bone">{Math.round(e.darker * 100)}%</b></span>
                  <span>孤立 <b className="text-bone">{Math.round(e.iso * 100)}%</b></span>
                </div>
                {on && <p className="mt-1.5 text-[10.5px] leading-relaxed text-mist">{e.note}</p>}
              </button>
            );
          })}
        </div>
        <p className="font-mono text-[9px] leading-relaxed text-mist/80">※ {LEGACY_FINDING}</p>
        <button onClick={resetStyle} className="w-full border border-white/14 px-2 py-1.5 font-mono text-[10px] tracking-widest text-mist transition-colors hover:border-gold hover:text-gold">
          RESET TO {ESSENCE[pack].name.toUpperCase()} ESSENCE
        </button>
      </Section>

      <Section title="STYLE ESSENCE / DEEP TUNING" note="実測プリセットから大胆にずらす">
        <div className="grid grid-cols-2 gap-2">
          <Slider label={`palette · ${n}px`} value={style.colors[n]} min={4} max={40} step={1} fmt={(v) => `${v}色`} onChange={(v) => stylePatch({ colors: { ...style.colors, [n]: v } })} />
          <Slider label={`ramp · ${n}px`} value={style.ramp[n]} min={2} max={24} step={1} fmt={(v) => `${v}段`} onChange={(v) => stylePatch({ ramp: { ...style.ramp, [n]: v } })} />
        </div>
        {styleSlider('hueShift', style.hueShift, 0, 36, 0.5, 'hue rotation', (v) => `${v.toFixed(1)}°`)}
        {styleSlider('Lmin', style.Lmin, 0.08, 0.72, 0.01, 'shadow floor', (v) => v.toFixed(2))}
        {styleSlider('Lmax', style.Lmax, 0.4, 0.99, 0.01, 'highlight ceiling', (v) => v.toFixed(2))}
        {styleSlider('cDark', style.cDark, 0.2, 1.5, 0.02, 'shadow chroma', (v) => `${v.toFixed(2)}×`)}
        {styleSlider('cLight', style.cLight, 0.3, 1.6, 0.02, 'highlight chroma', (v) => `${v.toFixed(2)}×`)}
        {styleSlider('selout', style.selout, 0, 2, 0.02, 'selective outline', (v) => v.toFixed(2))}
        {styleSlider('outlineDrop', style.outlineDrop, 0, 0.2, 0.005, 'outline depth', (v) => v.toFixed(3))}
        {styleSlider('outlineChroma', style.outlineChroma, 0, 2, 0.02, 'outline chroma', (v) => `${v.toFixed(2)}×`)}
        {styleSlider('ambient', style.ambient, 0.05, 0.8, 0.01, 'ambient light')}
        {styleSlider('light', style.light, 0.1, 1.4, 0.01, 'form / light')}
        {styleSlider('dir', style.dir, 0, 1, 0.01, 'directional share', (v) => `${Math.round(v * 100)}%`)}
        {styleSlider('contrast', style.contrast, 0.4, 1.8, 0.02, 'local contrast')}
        {styleSlider('noise', style.noise, 0, 0.65, 0.01, 'pixel grain')}
        {styleSlider('detail', style.detail, 0, 2, 0.02, 'surface detail')}
        {styleSlider('rim', style.rim, 0, 3, 1, 'metal rim light', (v) => `${v} step`)}
        {styleSlider('spec', style.spec ?? 1, 0, 2, 0.02, 'specular strength')}
        {styleSlider('dither', style.dither ?? 0.28, 0, 0.5, 0.02, 'band dither width', (v) => (v === 0 ? 'hard bands' : v.toFixed(2)))}
        {styleSlider('seamInk', style.seamInk ?? 1, 0, 2, 1, 'material seam ink', (v) => `${v} step`)}
        {styleSlider('ao', style.ao ?? 1, 0, 2, 1, 'corner occlusion', (v) => (v === 0 ? 'off' : `${v} step`))}
        <label className="flex items-center gap-2 text-[11px] text-mist">
          <input type="checkbox" checked={style.glint} onChange={(e) => stylePatch({ glint: e.target.checked })} className="accent-[#ffaa00]" />
          bevel glints
        </label>
      </Section>

      <Section title="GRADIENT / グラデーション" note={`${grad.mode}${work.design.grad ? ' · item' : ' · pack'}`}>
        <Seg value={grad.mode} cols={3} onChange={(v) => setGrad({ mode: v as GradMode })} options={GRADS} />
        <div className="grid grid-cols-2 gap-2">
          <Slider label="angle" value={grad.angle} min={0} max={359} step={1} fmt={(v) => `${v}°`} onChange={(v) => setGrad({ angle: v })} />
          <Slider label="spread" value={grad.spread} min={0} max={1} step={0.01} onChange={(v) => setGrad({ spread: v })} />
        </div>
        <Slider label="contrast" value={grad.contrast} min={0} max={2} step={0.02} onChange={(v) => setGrad({ contrast: v })} />
        <Slider label="bias" value={grad.bias} min={-1} max={1} step={0.02} onChange={(v) => setGrad({ bias: v })} />
        <Slider
          label="mix into shading" value={style.gradMix ?? 0.8} min={0} max={1} step={0.02}
          fmt={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => stylePatch({ gradMix: v })}
        />
        <label className="flex items-center gap-2 text-[11px] text-mist">
          <input type="checkbox" checked={grad.local} onChange={(e) => setGrad({ local: e.target.checked })} className="accent-[#ffaa00]" />
          パーツ単位で計算（OFF でキャンバス全体基準）
        </label>
        {work.design.grad && (
          <button onClick={() => setD({ grad: undefined })} className="w-full border border-white/14 px-2 py-1.5 font-mono text-[10px] tracking-widest text-mist hover:border-gold hover:text-gold">
            アイテムのグラデーション指定を解除して既定に戻す
          </button>
        )}
      </Section>

      <Section title="HIGHLIGHT & HUE" note="最終色への効果">
        <Slider
          label="highlight punch" value={style.highlightPunch ?? 1} min={0.6} max={1.8} step={0.02}
          onChange={(v) => stylePatch({ highlightPunch: v })}
        />
        <Slider
          label="aura hue drift" value={style.hueDrift ?? 0} min={0} max={1} step={0.02}
          fmt={(v) => (v === 0 ? 'off' : `${v.toFixed(2)}×/loop`)}
          onChange={(v) => stylePatch({ hueDrift: v })}
        />
      </Section>

      <Section title="解像度 / NATIVE GRID" note="64 空間で作図 → 4×4 面積縮小">
        <Seg value={n} onChange={(v) => setN(v)} options={[{ v: 16, t: '16×16' }, { v: 32, t: '32×32' }, { v: 64, t: '64×64' }]} />
      </Section>

      <Section title="形状 / ARCHETYPE" note={`${A.en} · ${A.handheld ? 'handheld' : 'generated'}`}>
        {(['武器', '防具', '道具'] as const).map((cat) => (
          <div key={cat}>
            <div className="mb-1 text-[9px] font-bold tracking-[0.2em] text-mist">{cat}</div>
            <div className="grid grid-cols-5 gap-px bg-white/8 p-px">
              {(Object.keys(ARCHES) as ArchId[]).filter((a) => ARCHES[a].cat === cat).map((a) => (
                <button key={a} onClick={() => setD({ arch: a, a: 0, b: 0 })} className={`py-1.5 text-[10.5px] transition-colors ${work.design.arch === a ? 'bg-gold font-bold text-ink' : 'bg-panel text-mist hover:bg-slate hover:text-bone'}`}>
                  {ARCHES[a].jp}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="text-[9px] font-bold tracking-[0.2em] text-mist">形態 A</div>
        <Seg value={work.design.a} onChange={(v) => setD({ a: v })} options={A.A.map((t, i) => ({ v: i, t }))} cols={Math.min(3, A.A.length)} />
        <div className="text-[9px] font-bold tracking-[0.2em] text-mist">形態 B</div>
        <Seg value={work.design.b} onChange={(v) => setD({ b: v })} options={A.B.map((t, i) => ({ v: i, t }))} cols={Math.min(4, A.B.length)} />
        <Slider label="長さ" value={work.design.len} min={0} max={1} step={0.01} onChange={(v) => setD({ len: v })} />
        <Slider label="幅" value={work.design.wid} min={0} max={1} step={0.01} onChange={(v) => setD({ wid: v })} />
        <Slider label="装飾" value={work.design.orn} min={0} max={1} step={0.01} onChange={(v) => setD({ orn: v })} />
        <div className="grid grid-cols-2 gap-2">
          {([['gem', '宝石を嵌める'], ['rune', '霊紋を刻む']] as const).map(([k, t]) => (
            <button key={k} onClick={() => setD({ [k]: !work.design[k] })} className={`border px-2 py-1.5 text-[11px] ${work.design[k] ? 'border-gold bg-gold/15 text-gold' : 'border-white/12 text-mist hover:text-bone'}`}>
              {work.design[k] ? '✓ ' : ''}{t}
            </button>
          ))}
        </div>
        <div className="text-[9px] font-bold tracking-[0.2em] text-mist">SPECIAL ADORNMENT / CENTER + OUTER FRAME</div>
        <Seg
          value={work.design.adornment ?? 'none'}
          cols={4}
          onChange={(v) => setD({ adornment: v as Adornment })}
          options={[
            { v: 'none', t: 'なし' }, { v: 'filigree', t: '金細工' }, { v: 'crest', t: '紋章' }, { v: 'petals', t: '花弁' },
            { v: 'thorns', t: '棘' }, { v: 'sigil', t: '符印' }, { v: 'orbitals', t: '軌道核' },
            { v: 'cross', t: '十字' }, { v: 'crown', t: '王冠' }, { v: 'flame', t: '炎舌' },
          ]}
        />
        <p className="text-[10px] leading-relaxed text-mist">すべてシルエット中心へ接続する装飾なので、細い道具にも空中に浮かずに付加されます。</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onNewDesign} className="bg-gold px-2 py-2 text-[12px] font-black text-ink hover:bg-amber">新デザイン</button>
          <button onClick={onRandomAll} className="border border-gold/60 px-2 py-2 text-[12px] font-bold text-gold hover:bg-gold hover:text-ink">完全ランダム</button>
        </div>
        <div className="border-t border-white/8 pt-3">
          <div className="mb-1.5 text-[9px] font-bold tracking-[0.2em] text-mist">THEME FORGE / 調和ランダム</div>
          <div className="grid grid-cols-2 gap-px bg-white/8 p-px">
            {THEMES.map((theme) => (
              <button key={theme.id} onClick={() => onTheme(theme.id)} className="bg-panel px-2 py-1.5 text-left text-[10px] text-mist transition-colors hover:bg-gold hover:text-ink">
                <span className="block font-bold">{theme.name}</span>
                <span className="font-mono text-[8px] opacity-70">{theme.anim.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="BASE POSITION / CANVAS FIT" note={`native-pixel nudge · step ${unit.toFixed(2)}u64`}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
          <div className="space-y-1">
            <Slider label="X / pixels" value={(work.design.offsetX ?? 0) / unit} min={-maxOffsetPx} max={maxOffsetPx} step={1} fmt={(v) => `${v > 0 ? '+' : ''}${v}px`} onChange={(v) => transform({ offsetX: v * unit })} />
            <Slider label="Y / pixels" value={(work.design.offsetY ?? 0) / unit} min={-maxOffsetPx} max={maxOffsetPx} step={1} fmt={(v) => `${v > 0 ? '+' : ''}${v}px`} onChange={(v) => transform({ offsetY: v * unit })} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span />
            <button onClick={() => nudge(0, -1)} aria-label="move up one pixel" className="border border-white/14 px-2 py-1.5 text-mist hover:border-gold hover:text-gold">↑</button>
            <span />
            <button onClick={() => nudge(-1, 0)} aria-label="move left one pixel" className="border border-white/14 px-2 py-1.5 text-mist hover:border-gold hover:text-gold">←</button>
            <button onClick={() => transform({ offsetX: 0, offsetY: 0 })} title="center" className="border border-gold/40 px-2 py-1.5 text-[9px] text-gold">CTR</button>
            <button onClick={() => nudge(1, 0)} aria-label="move right one pixel" className="border border-white/14 px-2 py-1.5 text-mist hover:border-gold hover:text-gold">→</button>
            <span />
            <button onClick={() => nudge(0, 1)} aria-label="move down one pixel" className="border border-white/14 px-2 py-1.5 text-mist hover:border-gold hover:text-gold">↓</button>
            <span />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Slider label="scale X" value={work.design.scaleX ?? 1} min={0.4} max={1.4} step={0.01} onChange={(v) => transform({ scaleX: v })} />
          <Slider label="scale Y" value={work.design.scaleY ?? 1} min={0.4} max={1.4} step={0.01} onChange={(v) => transform({ scaleY: v })} />
        </div>
        <Slider label="rotation" value={work.design.rotation ?? 0} min={-180} max={180} step={1} fmt={(v) => `${v}°`} onChange={(v) => transform({ rotation: v })} />
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => transform({ flipX: !work.design.flipX })} className={`border px-2 py-1.5 text-[11px] ${work.design.flipX ? 'border-gold bg-gold/15 text-gold' : 'border-white/12 text-mist'}`}>↔ 横反転 {work.design.flipX ? 'ON' : 'OFF'}</button>
          <button onClick={() => transform({ flipY: !work.design.flipY })} className={`border px-2 py-1.5 text-[11px] ${work.design.flipY ? 'border-gold bg-gold/15 text-gold' : 'border-white/12 text-mist'}`}>↕ 縦反転 {work.design.flipY ? 'ON' : 'OFF'}</button>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-mist">
          <input type="checkbox" checked={work.design.autoFit !== false} onChange={(e) => transform({ autoFit: e.target.checked })} className="accent-[#ffaa00]" />
          auto-fit: keep silhouette inside safe pixel margin
        </label>
        <button onClick={() => setD(resetDesignTransform(work.design))} className="w-full border border-white/14 px-2 py-1.5 text-[10px] text-mist hover:border-gold hover:text-gold">位置・変形・結合をリセット</button>
      </Section>

      <Section title="PART EDIT / LAYER MERGE" note={`${partIds.length} named parts`}>
        <select value={activePart} onChange={(e) => setPartChoice(e.target.value)} className="w-full border border-white/12 bg-ink px-2 py-1.5 font-mono text-[11px] text-bone outline-none focus:border-gold">
          {partIds.map((id) => <option key={id} value={id}>{id}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <Slider label="part X px" value={(part.x ?? 0) / unit} min={-maxOffsetPx} max={maxOffsetPx} step={1} fmt={(v) => `${v}px`} onChange={(v) => setPart({ x: v * unit })} />
          <Slider label="part Y px" value={(part.y ?? 0) / unit} min={-maxOffsetPx} max={maxOffsetPx} step={1} fmt={(v) => `${v}px`} onChange={(v) => setPart({ y: v * unit })} />
        </div>
        <Slider label="part scale" value={part.scale ?? 1} min={0.35} max={2.5} step={0.01} onChange={(v) => setPart({ scale: v })} />
        <Slider label="part rotation" value={part.rotation ?? 0} min={-180} max={180} step={1} fmt={(v) => `${v}°`} onChange={(v) => setPart({ rotation: v })} />
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setPart({ flipX: !part.flipX })} className={`border px-2 py-1.5 text-[10px] ${part.flipX ? 'border-gold text-gold' : 'border-white/12 text-mist'}`}>part ↔</button>
          <button onClick={() => setPart({ flipY: !part.flipY })} className={`border px-2 py-1.5 text-[10px] ${part.flipY ? 'border-gold text-gold' : 'border-white/12 text-mist'}`}>part ↕</button>
        </div>
        <div className="border-t border-white/8 pt-3">
          <div className="mb-1.5 text-[9px] font-bold tracking-[0.18em] text-mist">MERGE PARTS · SHARED MATERIAL + BEVEL</div>
          <div className="flex gap-2">
            <select value={mergeChoice} onChange={(e) => setMergeChoice(e.target.value)} className="min-w-0 flex-1 border border-white/12 bg-ink px-1.5 py-1 text-[10px] text-bone">
              <option value="">merge with…</option>
              {partIds.filter((p) => p !== activePart).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={() => mergeWith(mergeChoice)} disabled={!mergeChoice} className="border border-gold/50 px-2 text-[10px] text-gold disabled:opacity-30">JOIN</button>
            <button onClick={unmerge} className="border border-white/12 px-2 text-[10px] text-mist">SPLIT</button>
          </div>
          {(work.design.mergeParts ?? []).length > 0 && <p className="mt-1.5 font-mono text-[9px] text-gold">fused: {(work.design.mergeParts ?? []).map((g) => g.join(' + ')).join(' / ')}</p>}
        </div>
        {work.design.arch === 'shield' && (
          <div className="border-t border-white/8 pt-3">
            <div className="mb-1 text-[9px] font-bold tracking-[0.18em] text-mist">ELEMENTAL CORE · MERGE / ORBIT</div>
            <Seg value={work.design.coreMode ?? 0} cols={2} onChange={(v) => setD({ coreMode: v, b: v === 0 ? 0 : v === 1 ? 1 : v === 2 ? 2 : 3 })} options={[{ v: 0, t: '単一融合' }, { v: 1, t: '双核融合' }, { v: 2, t: '三元素融合' }, { v: 3, t: '軌道プリズム' }]} />
            <p className="mt-1.5 text-[10px] leading-relaxed text-mist">JOINで複数の核パーツを単一の距離場・ベベルに統合。SPLITで個別素材に戻せます。</p>
          </div>
        )}
      </Section>

      <Section title="素材 / MATERIAL SLOTS" note="OKLCH ランプ · 実測彩度カーブ">
        {SLOTS.map((slot) => {
          const r = buildRamp(work.mats[slot], 6, style);
          return (
            <div key={slot} className="flex items-center gap-2">
              <span className="w-[54px] shrink-0 text-[10.5px] text-mist">{SLOT_LABEL[slot]}</span>
              <select value={work.mats[slot]} onChange={(e) => patch({ mats: { ...work.mats, [slot]: e.target.value as MatId } })} className="min-w-0 flex-1 border border-white/12 bg-ink px-1.5 py-1 text-[11.5px] text-bone outline-none focus:border-gold">
                {kinds.map((k) => (
                  <optgroup key={k} label={KIND_JP[k]}>
                    {(Object.keys(MATERIALS) as MatId[]).filter((m) => MATERIALS[m].kind === k).map((m) => (
                      <option key={m} value={m}>{MATERIALS[m].jp} · {MATERIALS[m].en}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className="flex h-5 shrink-0 border border-black/60">
                <span className="w-2" style={{ background: hex(r.outline) }} />
                {r.cols.map((c, i) => <span key={i} className="w-2" style={{ background: hex(c) }} />)}
              </span>
            </div>
          );
        })}
      </Section>

      <Section title="光とアニメ / LIGHT & MOTION" note={`${style.frames}f · ${style.frametime} ticks/frame`}>
        <Slider label="光源角度" value={light} min={0} max={359} step={1} onChange={setLight} fmt={(v) => `${v}°`} />
        <div className="text-[9px] font-bold tracking-[0.18em] text-mist">ANIMATION / PIXEL EFFECT</div>
        <Seg value={work.anim} cols={4} onChange={(v) => patch({ anim: v })} options={ANIMS} />
        <div className="grid grid-cols-3 gap-2">
          <Slider label="intensity" value={motion.intensity} min={0} max={1} step={0.02} onChange={(v) => setMotion({ intensity: v })} />
          <Slider label="speed" value={motion.speed} min={0.1} max={3} step={0.05} onChange={(v) => setMotion({ speed: v })} />
          <Slider label="density" value={motion.density} min={0.1} max={1.5} step={0.05} onChange={(v) => setMotion({ density: v })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Slider label="frame count" value={style.frames} min={2} max={24} step={1} fmt={(v) => `${v} frames`} onChange={(v) => stylePatch({ frames: v })} />
          <Slider label="frame time" value={style.frametime} min={1} max={10} step={1} fmt={(v) => `${v} ticks`} onChange={(v) => stylePatch({ frametime: v })} />
        </div>
      </Section>

      <Section title="SkyBlock ID / 判定" note="ExtraAttributes.id">
        <input value={work.id} onChange={(e) => patch({ id: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })} className="w-full border border-white/12 bg-ink px-2 py-1.5 font-mono text-[12px] text-bone outline-none focus:border-gold" />
        <input value={work.en} onChange={(e) => patch({ en: e.target.value })} className="w-full border border-white/12 bg-ink px-2 py-1.5 text-[12px] text-bone outline-none focus:border-gold" />
        <div className="grid grid-cols-2 gap-2">
          <select value={work.base} onChange={(e) => patch({ base: e.target.value })} className="border border-white/12 bg-ink px-1.5 py-1 font-mono text-[10.5px] text-bone outline-none focus:border-gold">
            {Array.from(new Set([work.base, ...BASE_ITEMS])).map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={work.rarity ?? ''} onChange={(e) => patch({ rarity: (e.target.value || null) as RarityId | null })} className="border border-white/12 bg-ink px-1.5 py-1 text-[11px] text-bone outline-none focus:border-gold">
            <option value="">（なし）</option>
            {(Object.keys(RARITIES) as RarityId[]).map((r) => <option key={r} value={r}>{RARITIES[r].en}</option>)}
          </select>
        </div>
        <p className="font-mono text-[9px] leading-relaxed text-mist">base = 1.8.9 のベースアイテム（OptiFine の items=）。Catharsis 形式では ID のみで判定。</p>
      </Section>
    </div>
  );
}
