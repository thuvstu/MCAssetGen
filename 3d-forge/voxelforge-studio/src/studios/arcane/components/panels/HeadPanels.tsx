import { Gem, Triangle, Orbit, Diamond, Star, Circle, Flower2, Hexagon, Sparkles, Box, Layers } from 'lucide-react';
import { useForge } from '../../hooks/useForge';
import { GEM_SWATCHES } from '../../lib/catalog/palettes';
import { FINIAL_PRESETS } from '../../lib/catalog/finials';
import { ALL_ADORNMENTS, ALL_GEM_CUTS, ALL_GEM_MOUNTS, ALL_HEADS, ALL_ORBITERS, ALL_TIPS, AdornmentStyle, GemCut, GemMount, HeadShape, InnerStyle, OrbiterStyle, TipStyle } from '../../lib/types';
import { GENERIC_ICONS, HEAD_ICONS, HEAD_LABELS, ORB_ICONS, ORB_LABELS, TIP_ICONS, TIP_LABELS } from '../icons';
import { Section, Slider, ColorField, Segmented, Stepper, IconGrid } from '../controls';

const GEM_CUT_LABELS: Record<GemCut, string> = {
  brilliant: 'ブリリアント', emerald: 'エメラルド', marquise: 'マーキス', cabochon: 'カボション',
  'star-cut': 'スター', opal: 'オパール', prism: 'プリズム', 'rose-cut': 'ローズ',
};
const GEM_MOUNT_LABELS: Record<GemMount, string> = {
  claw: '爪留め', bezel: '覆輪', cage: '籠枠', floating: '浮遊', halo: '光輪', petal: '花弁枠',
};
const ADORNMENT_LABELS: Record<AdornmentStyle, string> = {
  none: 'なし', filigree: '透かし彫り', 'star-map': '星図', 'thorn-vine': '荊蔦', 'gold-pave': '宝石舗装',
  'rune-engraving': '刻印ルーン', 'chain-drape': '金鎖', 'petal-mantle': '花弁装', geodesic: '多面体籠', braided: '組紐金線',
};
const CUT_ICONS: Record<GemCut, React.ReactNode> = {
  brilliant: <Diamond className="h-3.5 w-3.5" />, emerald: <SquareGem />, marquise: <FeatherGem />,
  cabochon: <Circle className="h-3.5 w-3.5" />, 'star-cut': <Star className="h-3.5 w-3.5" />,
  opal: <Sparkles className="h-3.5 w-3.5" />, prism: <Triangle className="h-3.5 w-3.5" />, 'rose-cut': <Flower2 className="h-3.5 w-3.5" />,
};
function SquareGem() { return <span className="h-3 w-3 rotate-45 border border-current" />; }
function FeatherGem() { return <span className="h-3.5 w-2 -rotate-45 rounded-full border border-current" />; }

export function HeadPanel() {
  const { config, update } = useForge();
  return (
    <Section title="頭部 & 宝石" icon={<Gem className="h-4 w-4" />} tone="violet"
      keys={['headShape', 'headSize', 'gemColor', 'gemColor2', 'gemGlow', 'innerStyle', 'prongs']}>
      <IconGrid<HeadShape> label="形状 — 33種" value={config.headShape} cols={5} lockKey="headShape" maxHeight={318}
        options={ALL_HEADS.map((h) => ({ value: h, icon: HEAD_ICONS[h], label: HEAD_LABELS[h] }))}
        onChange={(v) => update({ headShape: v })} />
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="宝石" value={config.gemColor} onChange={(v) => update({ gemColor: v })} swatches={GEM_SWATCHES} lockKey="gemColor" />
        <ColorField label="内側" value={config.gemColor2} onChange={(v) => update({ gemColor2: v })} swatches={GEM_SWATCHES} lockKey="gemColor2" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Slider label="大きさ" value={config.headSize} min={0.14} max={0.44} onChange={(v) => update({ headSize: v })} format={(v) => `${Math.round(v * 100)}%`} lockKey="headSize" />
        <Slider label="内側の輝き" value={config.gemGlow} min={0} max={1} onChange={(v) => update({ gemGlow: v })} format={(v) => `${Math.round(v * 100)}%`} lockKey="gemGlow" />
      </div>
      <div className="grid grid-cols-2 items-center gap-3">
        <Segmented<InnerStyle> label="コア" value={config.innerStyle} cols={2} lockKey="innerStyle"
          options={[{ value: 'core', label: '核' }, { value: 'facet', label: '面' }, { value: 'swirl', label: '渦' }, { value: 'galaxy', label: '銀河' }]}
          onChange={(v) => update({ innerStyle: v })} />
        <Stepper label="爪の数" value={config.prongs} min={0} max={4} onChange={(v) => update({ prongs: v })} lockKey="prongs" />
      </div>
    </Section>
  );
}

export function TipPanel() {
  const { config, update } = useForge();
  return (
    <Section title="先端オブジェクト / Tip" icon={<Triangle className="h-4 w-4" />} defaultOpen={false} keys={['tipStyle', 'tipScale']}>
      <IconGrid<TipStyle> label="宝飾フィニアル — 28種" value={config.tipStyle} cols={5} tone="amber" lockKey="tipStyle" maxHeight={310}
        options={ALL_TIPS.map((t) => ({ value: t, icon: TIP_ICONS[t], label: TIP_LABELS[t] ?? t }))}
        onChange={(v) => update({ tipStyle: v })} />
      <Slider label="大きさ" value={config.tipScale} min={0.1} max={1} onChange={(v) => update({ tipScale: v })} format={(v) => `${Math.round(v * 100)}%`} lockKey="tipScale" />
    </Section>
  );
}

export function OrbiterPanel() {
  const { config, update } = useForge();
  return (
    <Section title="浮遊物 / Orbiters" icon={<Orbit className="h-4 w-4" />} defaultOpen={false} tone="cyan"
      keys={['orbiterStyle', 'orbiterCount', 'orbiterRadius', 'orbiterSize']}>
      <IconGrid<OrbiterStyle> label="浮遊レリック — 27種" value={config.orbiterStyle} cols={5} tone="cyan" showLabel lockKey="orbiterStyle" maxHeight={260}
        options={ALL_ORBITERS.map((o) => ({ value: o, icon: ORB_ICONS[o], label: ORB_LABELS[o] }))}
        onChange={(v) => update({ orbiterStyle: v })} />
      <div className="grid grid-cols-2 gap-3">
        <Stepper label="個数" value={config.orbiterCount} min={0} max={6} onChange={(v) => update({ orbiterCount: v })} lockKey="orbiterCount" />
        <Slider label="大きさ" value={config.orbiterSize} min={0.05} max={0.28} onChange={(v) => update({ orbiterSize: v })} format={(v) => `${Math.round(v * 100)}%`} lockKey="orbiterSize" />
      </div>
      <Slider label="回転半径" value={config.orbiterRadius} min={1.1} max={2.4} onChange={(v) => update({ orbiterRadius: v })} format={(v) => `${v.toFixed(2)}×`} lockKey="orbiterRadius" />
    </Section>
  );
}

export function GemAtelierPanel() {
  const { config, update } = useForge();
  return (
    <Section title="宝石細工 / Gem Atelier" icon={<Diamond className="h-4 w-4" />} tone="cyan" defaultOpen={false}
      keys={['gemCut', 'gemMount', 'gemCount', 'gemScale']}>
      <IconGrid<GemCut> label="カット様式" value={config.gemCut ?? 'brilliant'} cols={4} tone="cyan" lockKey="gemCut"
        options={ALL_GEM_CUTS.map((cut) => ({ value: cut, icon: CUT_ICONS[cut], label: GEM_CUT_LABELS[cut] }))}
        onChange={(v) => update({ gemCut: v })} />
      <Segmented<GemMount> label="台座 / セッティング" value={config.gemMount ?? 'claw'} cols={3} lockKey="gemMount"
        options={ALL_GEM_MOUNTS.map((mount) => ({ value: mount, label: GEM_MOUNT_LABELS[mount] }))}
        onChange={(v) => update({ gemMount: v })} />
      <div className="grid grid-cols-2 gap-3">
        <Stepper label="副宝石数" value={config.gemCount ?? 3} min={0} max={8} onChange={(v) => update({ gemCount: v })} lockKey="gemCount" />
        <Slider label="副宝石サイズ" value={config.gemScale ?? 0.18} min={0.06} max={0.36} onChange={(v) => update({ gemScale: v })} format={(v) => `${Math.round(v * 100)}%`} lockKey="gemScale" />
      </div>
      <p className="text-[10px] leading-relaxed text-stone-500">カットは宝石面の光の割れ方、台座は爪・覆輪・鳥籠・浮遊の仕立てを決めます。副宝石は独立した多面カットで描画。</p>
    </Section>
  );
}

export function AdornmentAtelierPanel() {
  const { config, update } = useForge();
  return (
    <Section title="工芸装飾 / Haute Joaillerie" icon={<Sparkles className="h-4 w-4" />} defaultOpen={false} tone="amber"
      keys={['adornmentStyle', 'adornmentDensity']}>
      <IconGrid<AdornmentStyle> label="工芸様式" value={config.adornmentStyle ?? 'filigree'} cols={5} tone="amber" lockKey="adornmentStyle" maxHeight={235}
        options={ALL_ADORNMENTS.map((style) => ({
          value: style,
          icon: style === 'star-map' ? <Star className="h-3.5 w-3.5" /> : style === 'thorn-vine' ? <span className="text-[12px]">❧</span> : style === 'gold-pave' ? <Gem className="h-3.5 w-3.5" /> : style === 'rune-engraving' ? <Hexagon className="h-3.5 w-3.5" /> : style === 'chain-drape' ? <Orbit className="h-3.5 w-3.5" /> : style === 'petal-mantle' ? <Flower2 className="h-3.5 w-3.5" /> : style === 'geodesic' ? <Box className="h-3.5 w-3.5" /> : style === 'braided' ? <Layers className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5 opacity-30" />,
          label: ADORNMENT_LABELS[style],
        }))}
        onChange={(v) => update({ adornmentStyle: v })} />
      <Slider label="装飾密度" value={config.adornmentDensity ?? 0.45} min={0} max={1} onChange={(v) => update({ adornmentDensity: v })} format={(v) => `${Math.round(v * 100)}%`} lockKey="adornmentDensity" />
      <p className="text-[10px] leading-relaxed text-stone-500">杖身から頭部を連続して飾る追加工芸レイヤー。透かし・星図・荊蔦・宝石舗装・組紐など。</p>
    </Section>
  );
}

export function FinialShelf() {
  const { applyFinial } = useForge();
  return (
    <Section title="先端工房 / Finial Recipes" icon={<Triangle className="h-4 w-4" />} defaultOpen={false} tone="fuchsia">
      <p className="-mt-1 text-[10px] leading-relaxed text-stone-500">先端・宝石カット・台座・副宝石・装飾を一括で設計した宝飾師のレシピ。</p>
      <div className="grid grid-cols-2 gap-1.5">
        {FINIAL_PRESETS.map((recipe, i) => (
          <button key={recipe.id} onClick={() => applyFinial(i)} title={`${recipe.nameEn} — ${recipe.desc}`}
            className="group flex items-center gap-2 rounded-xl border border-white/8 bg-black/30 p-2 text-left transition hover:border-fuchsia-300/40 hover:bg-fuchsia-500/10">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-white/10" style={{ color: recipe.accent, background: `${recipe.accent}18` }}>
              {GENERIC_ICONS[recipe.icon] ?? <Gem className="h-4 w-4" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[10px] font-bold text-stone-200">{recipe.name}</span>
              <span className="block truncate text-[8px] uppercase tracking-wider text-stone-600">{recipe.nameEn}</span>
            </span>
          </button>
        ))}
      </div>
    </Section>
  );
}
