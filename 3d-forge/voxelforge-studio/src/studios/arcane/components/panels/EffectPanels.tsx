import { Sparkles, Layers, Palette, Wand } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useForge } from '../../hooks/useForge';
import { GLOW_SWATCHES, HALO_SWATCHES, WING_SWATCHES } from '../../lib/catalog/palettes';
import { ANIMATIONS } from '../../lib/catalog/presets';
import { ALL_HALOS, ALL_MOTIFS, ALL_PARTICLES, ALL_WINGS, FinishStyle, HaloStyle, MotifStyle, OutlineStyle, ParticleStyle, WingStyle } from '../../lib/types';
import { MOTIF_ICONS } from '../icons';
import { Section, Slider, ColorField, Segmented, Toggle, Stepper, IconGrid, LockPin } from '../controls';

export function MotifPanel() {
  const { config, update } = useForge();
  return (
    <Section title="属性モチーフ / Motif" icon={<Sparkles className="h-4 w-4" />} defaultOpen={false} tone="fuchsia" keys={['motif', 'motifIntensity']}>
      <IconGrid<MotifStyle> label="周囲に漂う属性エフェクト" value={config.motif} cols={4} tone="fuchsia" lockKey="motif"
        options={ALL_MOTIFS.map((m) => ({ value: m, icon: MOTIF_ICONS[m], label: m }))}
        onChange={(v) => update({ motif: v })} />
      <Slider label="強度" value={config.motifIntensity} min={0} max={1} onChange={(v) => update({ motifIntensity: v })} format={(v) => `${Math.round(v * 100)}%`} lockKey="motifIntensity" />
    </Section>
  );
}

export function DecorPanel() {
  const { config, update } = useForge();
  return (
    <Section title="羽・光輪・角・粒子" icon={<Layers className="h-4 w-4" />} defaultOpen={false}
      keys={['wings', 'wingColor', 'halo', 'haloColor', 'horns', 'hornColor', 'particles', 'particleStyle', 'particleColor']}>
      <Segmented<WingStyle> label="翼" value={config.wings} cols={4} lockKey="wings"
        options={ALL_WINGS.map((w) => ({ value: w, label: ({ none: '無', angel: '天使', bat: '蝙蝠', fae: '妖精', blade: '刃', seraph: '熾天使', mech: '機械', crystal: '結晶', flame: '炎翼', leafwing: '葉翼', peacock: '孔雀', cape: '絹覆' })[w] }))}
        onChange={(v) => update({ wings: v })} />
      <ColorField label="翼の色" value={config.wingColor} onChange={(v) => update({ wingColor: v })} swatches={WING_SWATCHES} lockKey="wingColor" />
      <Segmented<HaloStyle> label="光輪" value={config.halo} cols={4} lockKey="halo"
        options={ALL_HALOS.map((h) => ({ value: h, label: ({ none: '無', ring: '輪', double: '二重', 'rune-ring': '符文', eclipse: '食', sunburst: '光芒', triple: '三重', 'hex-grid': '六角', spiral: '螺旋', shattered: '破砕', 'lens-flare': '閃耀' })[h] }))}
        onChange={(v) => update({ halo: v })} />
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="光輪の色" value={config.haloColor} onChange={(v) => update({ haloColor: v })} swatches={HALO_SWATCHES} lockKey="haloColor" />
        <ColorField label="角の色" value={config.hornColor} onChange={(v) => update({ hornColor: v })} lockKey="hornColor" />
      </div>
      <Toggle label="湾曲した角" hint="悪魔風の象牙" value={config.horns} onChange={(v) => update({ horns: v })} lockKey="horns" />
      <div className="grid grid-cols-2 gap-3">
        <Slider label="粒子" value={config.particles} min={0} max={32} step={1} onChange={(v) => update({ particles: v })} format={(v) => `${Math.round(v)}`} lockKey="particles" />
        <ColorField label="粒子色" value={config.particleColor} onChange={(v) => update({ particleColor: v })} swatches={GLOW_SWATCHES} lockKey="particleColor" />
      </div>
      <Segmented<ParticleStyle> label="粒子の種類" value={config.particleStyle} cols={5} lockKey="particleStyle"
        options={ALL_PARTICLES.map((p) => ({ value: p, label: ({ sparkle: '煌', dots: '点', plus: '十字', diamonds: '菱', mixed: '混合', embers: '火', bubbles: '泡', snow: '雪', leaf: '葉', stars: '星', runes: '符', hearts: '心', ash: '灰', musical: '音', firefly: '蛍', 'glow-dust': '輝塵' })[p] }))}
        onChange={(v) => update({ particleStyle: v })} />
    </Section>
  );
}

export function FinishPanel() {
  const { config, update } = useForge();
  return (
    <Section title="仕上げ / Finish" icon={<Palette className="h-4 w-4" />} defaultOpen={false}
      keys={['outerGlow', 'glowColor', 'outline', 'finish', 'shading', 'contrast', 'dither', 'dropShadow']}>
      <div className="grid grid-cols-2 gap-3">
        <Slider label="宝石の近接発光" value={config.outerGlow} min={0} max={1} onChange={(v) => update({ outerGlow: v })} format={(v) => `${Math.round(v * 100)}%`} lockKey="outerGlow" />
        <ColorField label="輝き色" value={config.glowColor} onChange={(v) => update({ glowColor: v })} swatches={GLOW_SWATCHES} lockKey="glowColor" />
      </div>
      <Segmented<OutlineStyle> label="輪郭線" value={config.outline} cols={3} lockKey="outline"
        options={[{ value: 'none', label: '無' }, { value: 'dark', label: '暗' }, { value: 'light', label: '明' }, { value: 'gold', label: '金' }, { value: 'colored', label: '宝石' }, { value: 'selout', label: 'sel-out' }]}
        onChange={(v) => update({ outline: v })} />
      <Segmented<FinishStyle> label="表面" value={config.finish} cols={3} lockKey="finish"
        options={[{ value: 'matte', label: 'マット' }, { value: 'glossy', label: '光沢' }, { value: 'metallic', label: '金属' }, { value: 'enchanted', label: 'エンチャ' }, { value: 'weathered', label: '劣化' }]}
        onChange={(v) => update({ finish: v })} />
      <div className="grid grid-cols-2 gap-3">
        <Slider label="シェーディング" value={config.shading} min={0} max={1} onChange={(v) => update({ shading: v })} format={(v) => `${Math.round(v * 100)}%`} lockKey="shading" />
        <Slider label="コントラスト" value={config.contrast} min={0.6} max={1.4} onChange={(v) => update({ contrast: v })} format={(v) => `${v.toFixed(2)}×`} lockKey="contrast" />
      </div>
      <div className="space-y-1">
        <Toggle label="精細描画（スーパーサンプリング）" hint="細い柄も滑らかに・3× 内部解像度" value={config.refined} onChange={(v) => update({ refined: v })} />
        <Toggle label="アンチエイリアス輪郭" hint="OFF でバニラ準拠の硬い輪郭（実パックと同じ）" value={config.softEdge ?? false} onChange={(v) => update({ softEdge: v })} />
        <Toggle label="レトロ・ディザリング" hint="古典的なドット網目グラデーション" value={config.dither} onChange={(v) => update({ dither: v })} lockKey="dither" />
        <Toggle label="ドロップシャドウ" hint="アイコン用の焼き込み影" value={config.dropShadow} onChange={(v) => update({ dropShadow: v })} lockKey="dropShadow" />
      </div>
      <p className="-mt-1 text-[10px] leading-relaxed text-stone-600">
        実測: azisaba life パックは全テクスチャで<span className="text-amber-300/80">輪郭アルファが 0/255 の二値</span>。硬い輪郭がバニラの質感の核心です。
      </p>
    </Section>
  );
}

export function AnimationPanel() {
  const { anim, isAnimated, setAnim } = useForge();
  const def = ANIMATIONS.find((a) => a.id === anim.type);
  return (
    <Section title="アニメーション" icon={<Wand className="h-4 w-4" />} tone="fuchsia" keys={['animation']}>
      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="text-xs font-medium text-stone-400">モード</span>
          <LockPin keys="animation" />
        </div>
        <div className="custom-scroll grid max-h-[260px] grid-cols-2 gap-1 overflow-y-auto rounded-xl bg-black/30 p-1">
          {ANIMATIONS.map((a) => (
            <button key={a.id} onClick={() => setAnim({ type: a.id, frames: a.frames, fps: a.fps })} title={a.desc}
              className={cn('flex flex-col items-start gap-0.5 rounded-lg px-2 py-1.5 text-left transition',
                anim.type === a.id ? 'bg-gradient-to-b from-fuchsia-500/30 to-pink-500/10 text-fuchsia-100 ring-1 ring-fuchsia-400/40' : 'text-stone-400 hover:bg-white/5 hover:text-stone-200')}>
              <span className="text-[11px] font-bold leading-tight">{a.name}</span>
              <span className="text-[9px] uppercase tracking-wider text-stone-600">{a.en} · {a.frames}f/{a.fps}fps</span>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-stone-600">※ モード選択は再生設定のみ変更。必要な要素（属性・翼など）は自分で組み合わせられます。</p>
      </div>
      {isAnimated && def && (
        <>
          <p className="rounded-lg border border-fuchsia-400/15 bg-fuchsia-500/5 p-2 text-[10px] leading-snug text-fuchsia-200/80">
            <span className="font-bold text-fuchsia-200">{def.name}:</span> {def.desc}
          </p>
          <ApplyNeeds />
          <div className="grid grid-cols-2 gap-3">
            <Slider label="強度" value={anim.intensity} min={0} max={1} onChange={(v) => setAnim({ intensity: v })} format={(v) => `${Math.round(v * 100)}%`} />
            <Slider label="FPS" value={anim.fps} min={5} max={40} step={1} onChange={(v) => setAnim({ fps: v })} format={(v) => `${Math.round(v)}`} />
          </div>
          <Stepper label="フレーム数" value={anim.frames} min={2} max={32} onChange={(v) => setAnim({ frames: v })} />
          <Segmented<'loop' | 'pingpong'> label="ループ" value={anim.loopMode} cols={2} tone="fuchsia"
            options={[{ value: 'loop', label: 'ループ' }, { value: 'pingpong', label: 'ピンポン' }]}
            onChange={(v) => setAnim({ loopMode: v })} />
          <Toggle label="バニラ式グリント" hint="エンチャント風の斜め光沢を重ねる" value={anim.blendGlint} onChange={(v) => setAnim({ blendGlint: v })} />
          <Toggle label="mcmeta を同梱" hint="Minecraft アニメーションJSON" value={anim.mcmeta} onChange={(v) => setAnim({ mcmeta: v })} />
          <Toggle label="フレーム別PNG" hint="ZIP に全フレームを個別に書き出し" value={anim.frameByFrame} onChange={(v) => setAnim({ frameByFrame: v })} />
        </>
      )}
    </Section>
  );
}

/** "Apply recommended elements for this animation" — opt-in instead of silently overriding. */
function ApplyNeeds() {
  const { anim, update, flash } = useForge();
  const def = ANIMATIONS.find((a) => a.id === anim.type);
  const needs = def?.needs ?? {};
  const entries = Object.entries(needs);
  if (entries.length === 0) return null;
  return (
    <button onClick={() => { update(needs); flash('推奨設定を適用しました'); }}
      className="flex w-full items-center justify-between rounded-lg border border-fuchsia-400/25 bg-fuchsia-500/10 px-2.5 py-1.5 text-left text-[10px] text-fuchsia-100 transition hover:bg-fuchsia-500/20">
      <span>推奨設定を適用: <span className="font-mono text-fuchsia-200/80">{entries.map(([k, v]) => `${k}=${String(v)}`).join(' · ')}</span></span>
      <span className="ml-2 shrink-0 font-bold">適用</span>
    </button>
  );
}
