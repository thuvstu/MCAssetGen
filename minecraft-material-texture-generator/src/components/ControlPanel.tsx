import { PRESETS, FX_DEFAULT, FX_STYLES } from '../lib/presets';
import type { MaterialSettings } from '../lib/render';
import { makePalette } from '../lib/color';
import { randomMaterial } from '../lib/random';

interface Props {
  settings: MaterialSettings;
  onChange: (patch: Partial<MaterialSettings>) => void;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
        <span>{label}</span>
        <span className="font-mono text-zinc-300">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-emerald-400"
      />
    </label>
  );
}

export default function ControlPanel({ settings, onChange }: Props) {
  const pal = makePalette(settings);
  const swatches: [string, string][] = [
    ['輪郭', pal.outline],
    ['深影', pal.deep],
    ['影', pal.shadow],
    ['ベース', pal.base],
    ['明', pal.light],
    ['ハイライト', pal.highlight],
    ['光沢', pal.white],
  ];

  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-400">素材名</h2>
        <input
          value={settings.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="copper"
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-emerald-400"
        />
        <p className="mt-1 text-[11px] text-zinc-500">ファイル名に使われます(例: copper_ingot.png)</p>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">プリセット</h2>
          <button
            onClick={() => onChange(randomMaterial())}
            className="rounded border border-fuchsia-500/60 bg-fuchsia-500/10 px-2 py-0.5 text-[11px] font-medium text-fuchsia-200 hover:bg-fuchsia-500/25"
            title="名前・色・質感をランダム生成"
          >
            🎲 ランダム素材
          </button>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              title={`${p.label} (${p.name})`}
              onClick={() =>
                onChange({
                  name: p.name,
                  base: p.base,
                  secondary: p.secondary,
                  hueShift: p.hueShift ?? 6,
                  contrast: p.contrast ?? 1,
                  saturationBoost: p.saturationBoost ?? 0,
                  ...FX_DEFAULT,
                  ...p.fx,
                })
              }
              className={`group flex flex-col items-center gap-1 rounded-md border p-1 transition hover:border-emerald-400 ${
                settings.base === p.base ? 'border-emerald-400 bg-zinc-800' : 'border-zinc-800 bg-zinc-900'
              }`}
            >
              <span
                className="h-6 w-6 rounded-sm border border-black/40"
                style={{ background: `linear-gradient(135deg, ${p.base} 60%, ${p.secondary})` }}
              />
              <span className="w-full truncate text-center text-[10px] leading-none text-zinc-400 group-hover:text-zinc-200">
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">カラー</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-400">ベース色</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.base}
                onChange={(e) => onChange({ base: e.target.value })}
                className="h-9 w-10 cursor-pointer rounded border border-zinc-700 bg-zinc-900 p-0.5"
              />
              <input
                value={settings.base}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange({ base: v });
                }}
                defaultValue={settings.base}
                key={settings.base}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-400"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-400">サブ色(合金など)</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.secondary}
                onChange={(e) => onChange({ secondary: e.target.value })}
                className="h-9 w-10 cursor-pointer rounded border border-zinc-700 bg-zinc-900 p-0.5"
              />
              <input
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange({ secondary: v });
                }}
                defaultValue={settings.secondary}
                key={settings.secondary}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-400"
              />
            </div>
          </label>
        </div>

        <div>
          <span className="mb-1 block text-xs text-zinc-400">生成パレット</span>
          <div className="flex overflow-hidden rounded-md border border-zinc-700">
            {swatches.map(([label, c]) => (
              <div key={label} title={`${label} ${c}`} className="h-7 flex-1" style={{ background: c }} />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">シェーディング</h2>
        <Slider
          label="コントラスト"
          value={settings.contrast}
          min={0.3}
          max={1.8}
          step={0.05}
          onChange={(v) => onChange({ contrast: v })}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label="色相シフト(ハイライト⇄影)"
          value={settings.hueShift}
          min={-30}
          max={30}
          step={1}
          onChange={(v) => onChange({ hueShift: v })}
          format={(v) => `${v > 0 ? '+' : ''}${v}°`}
        />
        <Slider
          label="彩度補正"
          value={settings.saturationBoost}
          min={-40}
          max={40}
          step={1}
          onChange={(v) => onChange({ saturationBoost: v })}
          format={(v) => `${v > 0 ? '+' : ''}${v}`}
        />
        <div className="flex flex-wrap gap-2">
          {[
            { l: 'バニラ風', c: 1, h: 6 },
            { l: 'ソフト', c: 0.65, h: 4 },
            { l: 'ハード', c: 1.4, h: 10 },
            { l: 'フラット', c: 0.4, h: 0 },
          ].map((s) => (
            <button
              key={s.l}
              onClick={() => onChange({ contrast: s.c, hueShift: s.h })}
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 hover:border-emerald-400 hover:text-white"
            >
              {s.l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={settings.outline}
              onChange={(e) => onChange({ outline: e.target.checked })}
              className="accent-emerald-400"
            />
            濃い輪郭線
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={settings.sparkle}
              onChange={(e) => onChange({ sparkle: e.target.checked })}
              className="accent-emerald-400"
            />
            光沢点(宝石)
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">質感エフェクト</h2>
        <div className="flex flex-wrap gap-2">
          {FX_STYLES.map((st) => {
            const active =
              st.fx.grain === settings.grain &&
              st.fx.brushed === settings.brushed &&
              st.fx.facet === settings.facet &&
              st.fx.patina === settings.patina &&
              st.fx.glow === settings.glow;
            return (
              <button
                key={st.id}
                onClick={() => onChange({ ...st.fx })}
                className={`rounded border px-2 py-1 text-[11px] ${
                  active
                    ? 'border-emerald-400 bg-zinc-800 text-white'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>
        <Slider
          label="ざらつき(ピクセルの揺らぎ)"
          value={settings.grain}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ grain: v })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <Slider
          label="ブラシ目(金属の筋)"
          value={settings.brushed}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ brushed: v })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <Slider
          label="ファセット(宝石の面)"
          value={settings.facet}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ facet: v })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <Slider
          label="パティーナ(錆・緑青)"
          value={settings.patina}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ patina: v })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <Slider
          label="発光ハロ(ルーン・魔力)"
          value={settings.glow}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ glow: v })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">ノイズ(粉・原石・鉱石)</h2>
        <Slider
          label="粒度"
          value={settings.noiseAmount}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ noiseAmount: v })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">シード</span>
          <input
            type="number"
            value={settings.seed}
            onChange={(e) => onChange({ seed: parseInt(e.target.value || '0', 10) })}
            className="w-24 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-400"
          />
          <button
            onClick={() => onChange({ seed: Math.floor(Math.random() * 99999) })}
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 hover:border-emerald-400 hover:text-white"
          >
            🎲 ランダム
          </button>
        </div>
      </section>
    </div>
  );
}
