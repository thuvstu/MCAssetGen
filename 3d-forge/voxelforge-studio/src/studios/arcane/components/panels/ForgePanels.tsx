import React from 'react';
import { Palette as PaletteIcon, Droplets, Wrench, Shuffle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useForge } from '../../hooks/useForge';
import { applyHarmony, rotateHue } from '../../lib/harmony';
import {
  ALL_DANGLES, ALL_HARMONIES, ALL_MOTIFS, ALL_WEARS, DangleStyle, HarmonyScheme, MotifStyle, WearStyle,
} from '../../lib/types';
import { MOTIF_ICONS } from '../icons';
import { Section, Slider, Segmented, Stepper, IconGrid } from '../controls';

/* ═══════════ 配色・パレット ═══════════ */
export function PalettePanel() {
  const { config, update, flash } = useForge();
  const harmony = config.harmony ?? 'custom';
  const pSize = config.paletteSize ?? 0;
  return (
    <Section title="配色 & パレット" icon={<PaletteIcon className="h-4 w-4" />} defaultOpen={false} tone="cyan" keys={['harmony', 'paletteSize']}>
      <Segmented<HarmonyScheme> label="カラーハーモニー" value={harmony} cols={4} tone="cyan" lockKey="harmony"
        options={ALL_HARMONIES.map((h) => ({
          value: h,
          label: { custom: '自由', complementary: '補色', analogous: '類似', triadic: '三色', split: '分裂', tetradic: '四色', monochrome: '単色' }[h],
        }))}
        onChange={(v) => { update(applyHarmony(config, v)); flash(v === 'custom' ? '自由配色' : '宝石色から一括再配色'); }} />
      <p className="-mt-1 text-[10px] leading-snug text-stone-500">宝石色を基準に、色相環の法則で全ての色を導出します。</p>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-stone-400">色相を回す</span>
          <span className="font-mono text-[10px] text-cyan-300">HUE</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {[-0.25, -0.12, -0.05, 0.05, 0.12, 0.25].map((t) => (
            <button key={t} onClick={() => update(rotateHue(config, t))}
              className="rounded-lg bg-black/30 py-1.5 text-[10px] font-semibold text-stone-300 transition hover:bg-cyan-500/20 hover:text-cyan-100">
              {t > 0 ? `+${Math.round(t * 360)}°` : `${Math.round(t * 360)}°`}
            </button>
          ))}
        </div>
      </div>

      <Slider label="色数制限（メディアンカット量子化）" value={pSize} min={0} max={32} step={1}
        onChange={(v) => update({ paletteSize: Math.round(v) })}
        format={(v) => (v < 2 ? '無制限' : `${Math.round(v)} 色`)} lockKey="paletteSize" />
      <p className="-mt-1 text-[10px] leading-snug text-stone-500">
        本物のドット絵の制約を再現。8〜16色に絞ると一気にレトロで締まった画面になります。
      </p>
      <div className="grid grid-cols-5 gap-1">
        {[0, 6, 8, 12, 16].map((n) => (
          <button key={n} onClick={() => update({ paletteSize: n })}
            className={cn('rounded-lg py-1.5 text-[10px] font-bold transition',
              pSize === n ? 'bg-cyan-500/25 text-cyan-100 ring-1 ring-cyan-400/40' : 'bg-black/30 text-stone-500 hover:text-stone-300')}>
            {n === 0 ? '∞' : n}
          </button>
        ))}
      </div>
    </Section>
  );
}

/* ═══════════ 吊り飾り & 摩耗 ═══════════ */
export function DetailPanel() {
  const { config, update } = useForge();
  return (
    <Section title="吊り飾り & 摩耗" icon={<Wrench className="h-4 w-4" />} defaultOpen={false}
      keys={['dangleStyle', 'dangleCount', 'wearStyle', 'wearAmount']}>
      <Segmented<DangleStyle> label="吊り下げ装飾" value={config.dangleStyle ?? 'none'} cols={4} lockKey="dangleStyle"
        options={ALL_DANGLES.map((d) => ({
          value: d,
          label: { none: '無', ribbon: 'リボン', 'chain-charm': '鎖飾', bell: '鈴', feather: '羽', 'crystal-drop': '雫晶', beads: '数珠', 'talisman-tag': '護符' }[d],
        }))}
        onChange={(v) => update({ dangleStyle: v })} />
      <Stepper label="吊り数" value={config.dangleCount ?? 2} min={0} max={4} onChange={(v) => update({ dangleCount: v })} lockKey="dangleCount" />

      <Segmented<WearStyle> label="摩耗・ダメージ" value={config.wearStyle ?? 'none'} cols={4} lockKey="wearStyle"
        options={ALL_WEARS.map((w) => ({
          value: w,
          label: { none: '無', chipped: '欠け', cracked: 'ひび', scratched: '擦傷', burned: '焦げ', mossy: '苔', 'frosted-over': '霜', 'blood-stained': '血' }[w],
        }))}
        onChange={(v) => update({ wearStyle: v })} />
      <Slider label="摩耗量" value={config.wearAmount ?? 0.35} min={0} max={1} onChange={(v) => update({ wearAmount: v })}
        format={(v) => `${Math.round(v * 100)}%`} lockKey="wearAmount" />
      <p className="-mt-1 text-[10px] leading-snug text-stone-500">
        シルエット内だけに適用。欠けは輪郭を削り、ひびは応力ハイライト付きで走ります。
      </p>
    </Section>
  );
}

/* ═══════════ 第2モチーフ層 ═══════════ */
export function Motif2Panel() {
  const { config, update } = useForge();
  return (
    <Section title="第2モチーフ層" icon={<Droplets className="h-4 w-4" />} defaultOpen={false} tone="fuchsia"
      keys={['motif2', 'motif2Intensity']}>
      <IconGrid<MotifStyle> label="重ねるエフェクト" value={config.motif2 ?? 'none'} cols={6} tone="fuchsia" lockKey="motif2" showLabel={false}
        options={ALL_MOTIFS.map((m) => ({ value: m, icon: MOTIF_ICONS[m], label: m }))}
        onChange={(v) => update({ motif2: v })} />
      <Slider label="第2強度" value={config.motif2Intensity ?? 0.4} min={0} max={1} onChange={(v) => update({ motif2Intensity: v })}
        format={(v) => `${Math.round(v * 100)}%`} lockKey="motif2Intensity" />
      <p className="-mt-1 text-[10px] leading-snug text-stone-500">
        2種のモチーフを重ねて「炎＋ルーン」「星座＋羽根」のような複合エフェクトを作れます。
      </p>
    </Section>
  );
}

/* ═══════════ バリエーション・スプレッド ═══════════ */
export function VariantSpread() {
  const { config, replace, flash } = useForge();
  const [n] = React.useState(8);
  const spread = React.useMemo(() => {
    // deterministic hue fan around the current gem colour
    return Array.from({ length: n }, (_, i) => {
      const turns = (i - (n - 1) / 2) * 0.055;
      return { ...config, ...rotateHue(config, turns), seed: config.seed + i * 101 };
    });
  }, [config, n]);
  return (
    <div className="panel-luxe p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Shuffle className="h-3.5 w-3.5 text-cyan-300" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">色相バリエーション — クリックで採用</span>
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {spread.map((v, i) => (
          <button key={i} onClick={() => { replace(v); flash('バリエーションを採用'); }}
            className="aspect-square overflow-hidden rounded-lg border border-white/10 bg-[#141022] transition hover:border-cyan-300/50 hover:shadow-[0_0_12px_rgba(103,232,249,0.3)]">
            <MiniCanvas config={v} />
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniCanvas({ config }: { config: Parameters<typeof rotateHue>[0] }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(async () => {
      if (cancelled || !ref.current) return;
      const { renderStaff } = await import('../../lib/render');
      if (!cancelled && ref.current) renderStaff({ ...config, refined: false, animation: undefined }, ref.current);
    });
    return () => { cancelled = true; cancelAnimationFrame(id); };
  }, [config]);
  return <canvas ref={ref} className="pixelated h-full w-full" />;
}
