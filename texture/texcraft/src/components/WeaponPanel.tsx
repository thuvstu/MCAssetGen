import { useEffect, useMemo, useState } from 'react';
import { Tex, download, texToDataURL } from '../lib/tex';
import { Layer, applyStack } from '../lib/effects';
import {
  STAGES, FORMS, ANIMS, VARIATIONS, buildLayers, generateAnimFrames, makeVerticalStrip,
  StageId, FormId, ModeId, VariationTag,
} from '../lib/weapon';

type Sub = 'stages' | 'forms' | 'variants' | 'anims';

const SUBS: [Sub, string][] = [
  ['stages', '⚔ 段階強化'],
  ['forms', '🌀 形態変化'],
  ['variants', '🏅 値'],
  ['anims', '💥 攻撃/魔法'],
];

export default function WeaponPanel({ base, name, onApply }: {
  base: Tex;
  name: string;
  onApply: (layers: Layer[], label: string) => void;
}) {
  const [sub, setSub] = useState<Sub>('stages');
  const [stage, setStage] = useState<StageId>('base');
  const [form, setForm] = useState<FormId>('normal');
  const [variation, setVariation] = useState<VariationTag>('standard');
  const [anim, setAnim] = useState<ModeId>('swing');
  const [animFrame, setAnimFrame] = useState(0);

  const render = (s: StageId, f: FormId, v: VariationTag, m?: ModeId, t = 0.25) =>
    applyStack(base, buildLayers(s, f, v, m), t);

  const thumbs = useMemo(() => {
    const map: Record<string, string> = {};
    if (sub === 'stages') for (const s of STAGES) map[s.id] = texToDataURL(render(s.id, form, variation));
    else if (sub === 'forms') for (const f of FORMS) map[f.id] = texToDataURL(render(stage, f.id, variation));
    else if (sub === 'variants') for (const v of VARIATIONS) map[v.tag] = texToDataURL(render(stage, form, v.tag));
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub, base, stage, form, variation]);

  const animDef = ANIMS.find((a) => a.id === anim)!;
  const animUrls = useMemo(
    () => (sub === 'anims' ? generateAnimFrames(base, stage, form, anim, variation).map((t) => texToDataURL(t)) : []),
    [sub, base, stage, form, anim, variation]
  );
  useEffect(() => setAnimFrame(0), [anim, sub, base]);
  useEffect(() => {
    if (animUrls.length < 2) return;
    const id = setInterval(() => setAnimFrame((f) => (f + 1) % animUrls.length), 1000 / animDef.fps);
    return () => clearInterval(id);
  }, [animUrls, animDef]);

  /* --- export: full upgrade line as one sheet --- */
  const exportLine = () => {
    const cells = STAGES.map((s) => ({ tex: render(s.id, form, variation), label: s.name }));
    const w = cells[0].tex.w, h = cells[0].tex.h, cols = 4, rows = 2;
    const c = document.createElement('canvas');
    c.width = cols * (w + 8) + 8;
    c.height = rows * (h + 8) + 8;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#141417';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.imageSmoothingEnabled = false;
    let left = cells.length;
    cells.forEach((cell, i) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 8 + (i % cols) * (w + 8), 8 + Math.floor(i / cols) * (h + 8), w, h);
        if (--left === 0) download(c.toDataURL(), `${name}_${form}_upgrades.png`);
      };
      img.src = texToDataURL(cell.tex);
    });
  };

  /* --- export: action animation as mc strip + mcmeta --- */
  const exportAnim = () => {
    const frames = generateAnimFrames(base, stage, form, anim, variation);
    download(texToDataURL(makeVerticalStrip(frames)), `${name}_${anim}.png`);
    const meta = { animation: { frametime: Math.max(1, Math.round(20 / animDef.fps)), loop: animDef.loop } };
    const u = URL.createObjectURL(new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' }));
    setTimeout(() => { download(u, `${name}_${anim}.png.mcmeta`); URL.revokeObjectURL(u); }, 300);
  };

  const pickStage = (id: StageId) => {
    setStage(id);
    onApply(buildLayers(id, form, variation), `段階「${STAGES.find((s) => s.id === id)!.name}」を適用`);
  };
  const pickForm = (id: FormId) => {
    setForm(id);
    onApply(buildLayers(stage, id, variation), `形態「${FORMS.find((f) => f.id === id)!.name}」に変化`);
  };
  const pickVariation = (tag: VariationTag) => {
    setVariation(tag);
    onApply(buildLayers(stage, form, tag), `「${VARIATIONS.find((v) => v.tag === tag)!.name}」仕様に変更`);
  };

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="grid grid-cols-2 gap-1">
        {SUBS.map(([id, label]) => (
          <button key={id} className={`tab ${sub === id ? 'tab-on' : ''}`} onClick={() => setSub(id)}>{label}</button>
        ))}
      </div>

      <div className="mc-panel p-2 space-y-1.5">
        <label className="flex items-center justify-between text-[11px] text-zinc-300">
          形態
          <select value={form} onChange={(e) => pickForm(e.target.value as FormId)}
            className="bg-[#1c1c1c] border-2 border-black rounded px-1 py-0.5 text-zinc-100">
            {FORMS.map((f) => <option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}
          </select>
        </label>
        <label className="flex items-center justify-between text-[11px] text-zinc-300">
          値
          <select value={variation} onChange={(e) => pickVariation(e.target.value as VariationTag)}
            className="bg-[#1c1c1c] border-2 border-black rounded px-1 py-0.5 text-zinc-100">
            {VARIATIONS.map((v) => <option key={v.tag} value={v.tag}>{v.icon} {v.name}</option>)}
          </select>
        </label>
      </div>

      {sub === 'stages' && (
        <>
          <p className="text-[11px] text-zinc-400">同一武器の強化ライン。クリックで段階を適用。</p>
          <div className="grid grid-cols-2 gap-1.5">
            {STAGES.map((s, i) => (
              <button key={s.id} className={`mc-slot text-left ${stage === s.id ? 'mc-slot-on' : ''}`} onClick={() => pickStage(s.id)}>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-[11px] font-bold leading-tight">{s.name}</span>
                  <span className="ml-auto text-[9px] text-zinc-400">{i + 1}/8</span>
                </div>
                <img src={thumbs[s.id]} alt="" className="w-full mt-1" style={{ imageRendering: 'pixelated' }} />
                <div className="h-1 mt-1" style={{ background: s.color }} />
              </button>
            ))}
          </div>
          <button className="btn btn-green w-full" onClick={exportLine}>📦 強化ライン8種を一括書き出し</button>
        </>
      )}

      {sub === 'forms' && (
        <>
          <p className="text-[11px] text-zinc-400">属性による形態変化。現在の段階に適用されます。</p>
          <div className="grid grid-cols-2 gap-1.5">
            {FORMS.map((f) => (
              <button key={f.id} className={`mc-slot text-left ${form === f.id ? 'mc-slot-on' : ''}`} onClick={() => pickForm(f.id)}>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{f.icon}</span>
                  <span className="text-[11px] font-bold">{f.name}</span>
                  <span className="ml-auto w-3 h-3 border-2 border-black" style={{ background: f.tint }} />
                </div>
                <img src={thumbs[f.id]} alt="" className="w-full mt-1" style={{ imageRendering: 'pixelated' }} />
              </button>
            ))}
          </div>
        </>
      )}

      {sub === 'variants' && (
        <>
          <p className="text-[11px] text-zinc-400">同一テーマ別の仕様変化（値/希少度）。</p>
          <div className="grid grid-cols-2 gap-1.5">
            {VARIATIONS.map((v) => (
              <button key={v.tag} className={`mc-slot text-left ${variation === v.tag ? 'mc-slot-on' : ''}`} onClick={() => pickVariation(v.tag)}>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{v.icon}</span>
                  <span className="text-[11px] font-bold">{v.name}</span>
                </div>
                <img src={thumbs[v.tag]} alt="" className="w-full mt-1" style={{ imageRendering: 'pixelated' }} />
              </button>
            ))}
          </div>
        </>
      )}

      {sub === 'anims' && (
        <>
          <div className="grid grid-cols-4 gap-1">
            {ANIMS.map((a) => (
              <button key={a.id} className={`mc-slot text-center ${anim === a.id ? 'mc-slot-on' : ''}`} onClick={() => setAnim(a.id)}>
                <div className="text-base leading-none">{a.icon}</div>
                <div className="text-[10px] font-bold mt-0.5">{a.name}</div>
              </button>
            ))}
          </div>
          <div className="mc-panel p-2">
            <img src={animUrls[animFrame] || texToDataURL(base)} alt="" className="w-full" style={{ imageRendering: 'pixelated' }} />
            <div className="flex gap-0.5 mt-1.5">
              {animUrls.map((_, i) => (
                <button key={i} className={`h-2 flex-1 border border-black ${i === animFrame ? 'bg-lime-500' : animDef.onHitFrame === i ? 'bg-red-500' : 'bg-zinc-600'}`} />
              ))}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              {animDef.frames}フレーム / {animDef.fps}fps{animDef.onHitFrame !== undefined && <> ・ 赤=命中フレーム {animDef.onHitFrame + 1}</>}
            </p>
          </div>
          <div className="flex gap-1">
            <button className="btn flex-1" onClick={() => onApply(buildLayers(stage, form, variation, anim), `「${animDef.name}」の演出を追加`)}>レイヤーに追加</button>
            <button className="btn btn-green flex-1" onClick={exportAnim}>🎞️ アニメ書き出し</button>
          </div>
        </>
      )}
    </div>
  );
}
