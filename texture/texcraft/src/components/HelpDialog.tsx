import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, Check, CircleHelp, FlaskConical, Keyboard, LoaderCircle, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import { EFFECTS } from '../lib/effects';
import { CheckResult, checkCompatibility } from '../lib/compatibility';
import { downloadBlob } from '../lib/tex';
import { PART_LIBRARY } from '../lib/weaponParts';

export default function HelpDialog({ onClose }: { onClose: () => void }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState([0, 0]);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const run = async () => {
    const controller = new AbortController(); abort.current = controller;
    setRunning(true); setResults(null);
    const result = await checkCompatibility((a, b) => setProgress([a, b]), controller.signal);
    if (!controller.signal.aborted) { setResults(result); setRunning(false); }
  };
  const failed = results?.filter((r) => !r.passed) || [];
  return <Modal title="TexCraftの使い方" subtitle="小さなピクセルに、大きな可能性を。" onClose={onClose}>
    <div className="dialog-body help-content">
      <section><h3><CircleHelp size={16} /> 3ステップでテクスチャを改良</h3><ol><li><strong>画像を選ぶ。</strong> サンプルを選択するか、画像をドロップ。スキンやUIは長方形のまま読み込めます。</li><li><strong>効果を重ねる。</strong> {EFFECTS.length}種類のエフェクトを自由に組み合わせ、不透明度やパラメーターを調整。</li><li><strong>武器工房で追加する。</strong> 進化ラボの「パーツを追加」から護拳・宝石・刃・柄巻き・ルーン等を個別に積み重ねます。「アニメーション」ではポーズのキーフレームを追加し、角度・移動・拡大率を編集。「エフェクトを追加」では武器の上へ全エフェクトを重ねます。制作状態はプロジェクトに自動保存されます。</li><li><strong>作品を書き出す。</strong> PNG、Minecraft用アニメーションPNG + .mcmeta ZIP、比較画像、再編集用プロジェクトとして保存。</li></ol><p>描画ツールはエフェクト適用前の元画像に描き込みます。変形後の画像に直接描く場合は、プロジェクトメニューから「焼き込み」を選んでください。</p></section>
      <section><h3><Keyboard size={16} /> キーボードショートカット</h3><div className="shortcut-grid">{[['H', '移動'], ['B', 'ペン'], ['E', '消しゴム'], ['G', '塗りつぶし'], ['I', 'スポイト'], ['Space', '再生 / 一時停止'], ['Ctrl / ⌘ + Z', '元に戻す'], ['Ctrl / ⌘ + S', 'プロジェクト保存'], ['Ctrl / ⌘ + O', '画像を読み込む'], ['Ctrl / ⌘ + V', '画像を貼り付け']].map(([key, label]) => <div key={key}><span>{label}</span><kbd>{key}</kbd></div>)}</div></section>
      <section><h3><ShieldCheck size={16} /> データと対応形式</h3><p>画像処理・自動保存はこのブラウザー内で行います。タブを閉じる前に、大切な作品はプロジェクトファイルで保存してください。PNG / JPEG / WebP、長辺16〜128pxに対応。アニメーションは最大64フレームの縦ストリップを読み込めます。</p><p>内蔵画像はオリジナルのサンプルです。Minecraftの全公式画像を同梱したものではありません。発光効果は画像上の表現で、ゲーム内の光源やシェーダー設定を追加するものではありません。</p></section>
      <section className="compatibility-section"><h3><FlaskConical size={16} /> 生成機能の互換性チェック</h3><p>16 / 32 / 64 / 128pxの画像で、{EFFECTS.length}エフェクト・{PART_LIBRARY.length}武器パーツ・8種類のモーションを検証します。</p><button className="secondary-button" disabled={running} onClick={run}>{running ? <LoaderCircle size={15} className="spin" /> : <FlaskConical size={15} />}{running ? `検証中 ${progress[0]} / ${progress[1]}` : 'このブラウザーで検証する'}</button>
        {running && <progress value={progress[0]} max={progress[1] || 1} />}
        {results && <div className="check-result" role="status"><span><Check size={15} /> {results.length - failed.length} / {results.length} 件が正常{failed.length > 0 && ` (${failed.length}件の問題)`}</span><button className="text-button" onClick={() => downloadBlob(new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' }), 'texcraft-compatibility.json')}><ArrowDownToLine size={13} /> 結果を保存</button>{failed.map((r, i) => <p className="form-error" key={i}>{r.effect} / {r.size}px: {r.error}</p>)}</div>}
      </section>
      <p className="legal-note">TexCraftはMinecraft公式の製品ではなく、Mojang / Microsoftとは関係ありません。</p>
    </div>
  </Modal>;
}