import { SlidersHorizontal, Hexagon } from 'lucide-react';
import { useForge } from '../../hooks/useForge';
import { METAL_COLORS, WOOD_SWATCHES } from '../../lib/catalog/palettes';
import type { CollarStyle, PommelStyle, ShaftStyle, WrapStyle } from '../../lib/types';
import { Section, Slider, ColorField, Segmented } from '../controls';

const SHAFT_OPTIONS: Array<{ value: ShaftStyle; label: string; group?: string }> = [
  { value: 'straight', label: '真直', group: '基本' }, { value: 'gnarled', label: '節', group: '基本' },
  { value: 'twisted', label: '捻', group: '基本' }, { value: 'bone', label: '骨', group: '基本' },
  { value: 'royal', label: '王家', group: '基本' }, { value: 'leather', label: '革', group: '基本' },
  { value: 'bamboo', label: '竹', group: '基本' }, { value: 'ornate', label: '装飾', group: '基本' },
  { value: 'crystal', label: '晶', group: '基本' }, { value: 'segmented', label: '節板', group: '基本' },
  { value: 'obsidian', label: '黒曜', group: '基本' }, { value: 'ivory', label: '象牙', group: '基本' },
  { value: 'ebony', label: '黒檀', group: '基本' }, { value: 'porcelain', label: '白磁', group: '基本' },
  { value: 'alloy', label: '合金', group: '基本' }, { value: 'braided', label: '編組', group: '基本' },
  { value: 'chain-link', label: '鎖節', group: '基本' }, { value: 'rune-carved', label: '刻彫', group: '基本' },
  { value: 'coral', label: '珊瑚', group: '基本' }, { value: 'techno', label: '機械', group: '基本' },
  { value: 'driftwood', label: '流木', group: '基本' },
  { value: 'oak', label: 'オーク', group: '木材' }, { value: 'birch', label: '白樺', group: '木材' },
  { value: 'dark-oak', label: '黒オーク', group: '木材' }, { value: 'spruce', label: 'トウヒ', group: '木材' },
  { value: 'jungle', label: 'ジャングル', group: '木材' }, { value: 'cherry', label: '桜木', group: '木材' },
  { value: 'mangrove', label: '紅樹', group: '木材' }, { value: 'azalea', label: '皐月', group: '木材' },
  { value: 'mech-brass', label: '黄銅管', group: '機械' }, { value: 'mech-iron', label: '鉄機械', group: '機械' },
  { value: 'copper', label: '銅管', group: '機械' }, { value: 'pipe', label: 'パイプ', group: '機械' },
  { value: 'conveyor', label: 'ベルト', group: '機械' },
  { value: 'gemmed', label: '宝留', group: '宝石' }, { value: 'gem-column', label: '宝石柱', group: '宝石' },
  { value: 'gem-tube', label: '宝石筒', group: '宝石' }, { value: 'embedding', label: '宝石嵌', group: '宝石' },
  { value: 'bamboo-woven', label: '竹篾', group: '海' }, { value: 'glass', label: '硝子筒', group: '海' },
  { value: 'prismarine', label: '海洋殻', group: '海' }, { value: 'kelp-rope', label: '昆布索', group: '海' },
  { value: 'anchor-chain', label: '錨鎖', group: '海' }, { value: 'sponge', label: '海綿', group: '海' },
];
const WRAP_OPTIONS: Array<{ value: WrapStyle; label: string }> = [
  { value: 'none', label: '無' }, { value: 'spiral', label: '螺旋' }, { value: 'rings', label: '環' }, { value: 'vine', label: '蔦' },
  { value: 'chain', label: '鎖' }, { value: 'rune-band', label: '符文' }, { value: 'stitch', label: '縫目' }, { value: 'scale', label: '鱗' },
];
const COLLAR_OPTIONS: Array<{ value: CollarStyle; label: string }> = [
  { value: 'none', label: '無' }, { value: 'ring', label: '環' }, { value: 'guard', label: '鎧' }, { value: 'crown', label: '冠' },
  { value: 'claw', label: '爪' }, { value: 'filigree', label: '線刻' }, { value: 'socket', label: '台座' },
  { value: 'wing-guard', label: '翼鎧' }, { value: 'skull-collar', label: '髑環' }, { value: 'orb-cage', label: '球檻' },
  { value: 'tea-cup', label: '盃' }, { value: 'bell-dome', label: '鐘蓋' },
];
const POMMEL_OPTIONS: Array<{ value: PommelStyle; label: string }> = [
  { value: 'none', label: '無' }, { value: 'cap', label: '帽' }, { value: 'gem', label: '宝石' }, { value: 'spike', label: '尖' },
  { value: 'ring', label: '輪' }, { value: 'tassel', label: '房' }, { value: 'skullcap', label: '髑' },
  { value: 'orb', label: '宝珠' }, { value: 'crescent', label: '三日月' }, { value: 'anchor', label: '锚' },
  { value: 'split-tassel', label: '二房' }, { value: 'lantern-hanger', label: '吊燈' },
];

export function ShaftPanel() {
  const { config, update } = useForge();
  return (
    <Section title="柄 / Shaft" icon={<SlidersHorizontal className="h-4 w-4" />}
      keys={['shaftStyle', 'shaftLength', 'shaftThickness', 'shaftAngle', 'shaftCurve', 'shaftColor', 'shaftColor2', 'shaftDetail', 'grain']}>
      <Segmented<ShaftStyle> label="材質" value={config.shaftStyle} cols={4} options={SHAFT_OPTIONS} onChange={(v) => update({ shaftStyle: v })} lockKey="shaftStyle" />
      <div className="grid grid-cols-2 gap-3">
        <Slider label="長さ" value={config.shaftLength} min={0.55} max={1} onChange={(v) => update({ shaftLength: v })} format={(v) => `${Math.round(v * 100)}%`} lockKey="shaftLength" />
        <Slider label="太さ" value={config.shaftThickness} min={0.016} max={0.13} onChange={(v) => update({ shaftThickness: v })} format={(v) => (v * 100).toFixed(1)} lockKey="shaftThickness" />
        <Slider label="角度" value={config.shaftAngle} min={-70} max={-15} step={1} onChange={(v) => update({ shaftAngle: v })} format={(v) => `${Math.round(v)}°`} lockKey="shaftAngle" />
        <Slider label="湾曲" value={config.shaftCurve} min={-0.18} max={0.18} onChange={(v) => update({ shaftCurve: v })} format={(v) => v.toFixed(2)} lockKey="shaftCurve" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="本体" value={config.shaftColor} onChange={(v) => update({ shaftColor: v })} swatches={WOOD_SWATCHES} lockKey="shaftColor" />
        <ColorField label="影色" value={config.shaftColor2} onChange={(v) => update({ shaftColor2: v })} lockKey="shaftColor2" />
      </div>
      <Slider label="ディテール（刻印・鋲）" value={config.shaftDetail} min={0} max={1} onChange={(v) => update({ shaftDetail: v })} format={(v) => `${Math.round(v * 100)}%`} lockKey="shaftDetail" />
      <Slider label="木目ノイズ" value={config.grain} min={0} max={1} onChange={(v) => update({ grain: v })} format={(v) => `${Math.round(v * 100)}%`} lockKey="grain" />
    </Section>
  );
}

export function FittingsPanel() {
  const { config, update } = useForge();
  return (
    <Section title="巻き & 口金" icon={<Hexagon className="h-4 w-4" />} defaultOpen={false}
      keys={['wrapStyle', 'wrapColor', 'wrapDensity', 'collarStyle', 'collarColor', 'prongColor', 'pommelStyle', 'pommelColor']}>
      <Segmented<WrapStyle> label="巻き装飾" value={config.wrapStyle} cols={4} options={WRAP_OPTIONS} onChange={(v) => update({ wrapStyle: v })} lockKey="wrapStyle" />
      <div className="grid grid-cols-2 items-end gap-3">
        <ColorField label="巻き色" value={config.wrapColor} onChange={(v) => update({ wrapColor: v })} swatches={METAL_COLORS} lockKey="wrapColor" />
        <Slider label="密度" value={config.wrapDensity} min={2} max={12} step={1} onChange={(v) => update({ wrapDensity: v })} format={(v) => `${Math.round(v)}`} lockKey="wrapDensity" />
      </div>
      <Segmented<CollarStyle> label="口金 / ガード" value={config.collarStyle} cols={4} options={COLLAR_OPTIONS} onChange={(v) => update({ collarStyle: v })} lockKey="collarStyle" />
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="金属色" value={config.collarColor} onChange={(v) => update({ collarColor: v })} swatches={METAL_COLORS} lockKey="collarColor" />
        <ColorField label="爪色" value={config.prongColor} onChange={(v) => update({ prongColor: v })} swatches={METAL_COLORS} lockKey="prongColor" />
      </div>
      <Segmented<PommelStyle> label="柄頭" value={config.pommelStyle} cols={4} options={POMMEL_OPTIONS} onChange={(v) => update({ pommelStyle: v })} lockKey="pommelStyle" />
      <ColorField label="柄頭の金属" value={config.pommelColor} onChange={(v) => update({ pommelColor: v })} swatches={METAL_COLORS} lockKey="pommelColor" />
    </Section>
  );
}
