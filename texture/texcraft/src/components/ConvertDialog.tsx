import { useState } from 'react';
import { Tex } from '../lib/tex';
import { PALETTES, reduceTex } from '../lib/pixelConvert';

export default function ConvertDialog({ base, onApply }: {
  base: Tex; onApply: (tex: Tex, label: string) => void;
}) {
  const names = Object.keys(PALETTES);
  const [palette, setPalette] = useState<string>(names[0]);
  const [colors, setColors] = useState(16);
  const [busy, setBusy] = useState(false);
  const apply = () => {
    setBusy(true);
    try {
      const out = reduceTex(base, palette === names[0] && PALETTES[palette] === null ? null : palette, colors);
      onApply(out, `ドット絵化（${palette}）`);
    } finally { setBusy(false); }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 12 }}>現在のテクスチャを減色してドット絵化します。パレット変換器の8パレット+k-meansを使用。</p>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>パレット
        <select value={palette} onChange={(e) => setPalette(e.target.value)}>
          {names.map((n) => <option key={n} value={n}>{n}{PALETTES[n] ? `（${PALETTES[n]!.length}色）` : ''}</option>)}
        </select>
      </label>
      {PALETTES[palette] === null && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>色数（k-means）
          <select value={colors} onChange={(e) => setColors(Number(e.target.value))}>{[4, 8, 12, 16, 24, 32].map((n) => <option key={n} value={n}>{n}</option>)}</select>
        </label>
      )}
      <button className="primary-button" disabled={busy} onClick={apply}>{busy ? '変換中…' : 'ドット絵化して開く'}</button>
      <span style={{ fontSize: 11 }}>現在の編集内容は置き換わります（必要なら先に保存）。</span>
    </div>
  );
}
