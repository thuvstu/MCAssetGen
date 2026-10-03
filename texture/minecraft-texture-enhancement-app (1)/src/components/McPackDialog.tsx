import { useState } from 'react';
import { Tex } from '../lib/tex';
import { Layer, EFFECT_MAP } from '../lib/effects';
import { MC_VERSIONS, COMMON_PATHS, buildEntry, downloadPack, validPath, type PackEntry } from '../lib/mcpack';

export default function McPackDialog({ base, layers, name, onNotify }: {
  base: Tex; layers: Layer[]; name: string; onNotify: (s: string) => void;
}) {
  const [entries, setEntries] = useState<PackEntry[]>([]);
  const [path, setPath] = useState('block/stone');
  const [ver, setVer] = useState('1.21.4');
  const [edition, setEdition] = useState<'java' | 'bedrock'>('java');
  const [packName, setPackName] = useState(`${name || 'TexCraft'} Pack`);
  const desc = 'TexCraftで作成したリソースパックです。';
  const animated = layers.some((l) => EFFECT_MAP[l.type]?.animated?.(l.params));
  const [anim, setAnim] = useState(animated);
  const [frames, setFrames] = useState(16);
  const loopSec = 2;
  const [interp, setInterp] = useState(false);
  const [busy, setBusy] = useState(false);
  const target = COMMON_PATHS.find((p) => p.path === path);
  const ok = validPath(path) && !entries.some((e) => e.path === path);

  const add = async () => {
    if (!ok || busy) return;
    setBusy(true);
    try {
      const e = await buildEntry({
        base, layers, path, label: target?.label ?? path,
        frames: anim ? frames : 1, loopSec, interpolate: interp,
      });
      setEntries([...entries.filter((x) => x.path !== path), e]);
      onNotify(`${e.label} をパックに追加しました`);
    } finally { setBusy(false); }
  };
  const save = async () => {
    if (!entries.length || busy) return;
    setBusy(true);
    try {
      await downloadPack(entries, { name: packName, description: desc, fmt: MC_VERSIONS.find((v) => v.v === ver)!.fmt, edition });
      onNotify('リソースパック (.zip) を保存しました');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>配置パス（assets/minecraft/textures/以下）
        <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="block/stone" style={{ padding: 8 }} />
      </label>
      {!validPath(path) && <span style={{ color: '#e05d5d', fontSize: 12 }}>パス形式が不正です（例: block/stone）</span>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 12 }}>版 <select value={edition} onChange={(e) => setEdition(e.target.value as 'java' | 'bedrock')}><option value="java">Java</option><option value="bedrock">Bedrock (.mcpack)</option></select></label>
        {edition === 'java' && <label style={{ fontSize: 12 }}>バージョン <select value={ver} onChange={(e) => setVer(e.target.value)}>{MC_VERSIONS.map((v) => <option key={v.v} value={v.v}>{v.l}</option>)}</select></label>}
        <label style={{ fontSize: 12 }}><input type="checkbox" checked={anim} onChange={(e) => setAnim(e.target.checked)} /> アニメ</label>
        {anim && <label style={{ fontSize: 12 }}>フレーム <select value={frames} onChange={(e) => setFrames(Number(e.target.value))}>{[4, 8, 12, 16, 24, 32].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>}
        {anim && <label style={{ fontSize: 12 }}><input type="checkbox" checked={interp} onChange={(e) => setInterp(e.target.checked)} /> 補間</label>}
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>パック名
        <input value={packName} onChange={(e) => setPackName(e.target.value)} style={{ padding: 8 }} />
      </label>
      <button className="primary-button" disabled={!ok || busy} onClick={() => void add()}>このテクスチャをパックに追加</button>
      {entries.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
          {entries.map((e) => <li key={e.key}>{e.label}（{e.path}.png{e.frames > 1 ? `, ${e.frames}フレーム` : ''}）</li>)}
        </ul>
      )}
      <button className="primary-button" disabled={!entries.length || busy} onClick={() => void save()}>リソースパック (.zip) を保存</button>
    </div>
  );
}
