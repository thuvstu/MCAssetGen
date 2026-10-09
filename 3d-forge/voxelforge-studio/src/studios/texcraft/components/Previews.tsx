import { useEffect, useRef, useState } from 'react';
import { Pause, RotateCcw, RotateCw } from 'lucide-react';

export function Block3D({ url, topUrl, item = false, size = 108, large = false, aspect = 1 }: { url: string; topUrl?: string; item?: boolean; size?: number; large?: boolean; aspect?: number }) {
  const [rot, setRot] = useState({ x: -25, y: -35 });
  const [auto, setAuto] = useState(false);
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  useEffect(() => {
    if (!auto) return;
    let raf = 0, last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(100, t - last); last = t;
      if (!drag.current) setRot((r) => ({ ...r, y: r.y + dt * 0.018 }));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [auto]);
  const face = (transform: string, shade: number, top = false) => <div className="cube-face" style={{ transform, backfaceVisibility: 'hidden' }}>
    <img src={top && topUrl ? topUrl : url} alt="" draggable={false} /><span style={{ background: `rgba(0,0,0,${shade})` }} />
  </div>;
  return <div className={`block-preview ${large ? 'large' : ''}`}>
    <div className="preview-ground" /><div className="cube-shadow" />
    <div className="cube-stage" style={{ perspective: size * 6 }}
      onPointerDown={(e) => { if (e.button !== 0) return; drag.current = { x: e.clientX, y: e.clientY, rx: rot.x, ry: rot.y }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { const d = drag.current; if (d) setRot({ x: Math.max(-85, Math.min(85, d.rx - (e.clientY - d.y) * 0.5)), y: d.ry + (e.clientX - d.x) * 0.5 }); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <div className="cube" style={{ width: size, height: item ? size * aspect : size, transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}>
        {item ? Array.from({ length: 7 }, (_, i) => <div key={i} className="cube-face" style={{ transform: `translateZ(${(i - 3) * size / 100}px)` }}><img src={url} alt="" draggable={false} style={{ filter: i === 6 || i === 0 ? undefined : 'brightness(.55)' }} /></div>) : <>
          {face(`translateZ(${size / 2}px)`, 0.1)}{face(`rotateY(180deg) translateZ(${size / 2}px)`, 0.3)}
          {face(`rotateY(90deg) translateZ(${size / 2}px)`, 0.26)}{face(`rotateY(-90deg) translateZ(${size / 2}px)`, 0.2)}
          {face(`rotateX(90deg) translateZ(${size / 2}px)`, 0, true)}{face(`rotateX(-90deg) translateZ(${size / 2}px)`, 0.45)}
        </>}
      </div>
    </div>
    <div className="preview-actions"><button className={`icon-button ${auto ? 'active' : ''}`} onClick={() => setAuto(!auto)} title={auto ? '回転を停止' : '自動回転'} aria-label={auto ? '回転を停止' : '自動回転'}>{auto ? <Pause size={13} /> : <RotateCw size={13} />}</button><button className="icon-button" onClick={() => { setAuto(false); setRot({ x: -25, y: -35 }); }} title="視点をリセット" aria-label="視点をリセット"><RotateCcw size={13} /></button></div>
    <span className="preview-hint">ドラッグして回転</span>
  </div>;
}

export function TilePreview({ url, w, h }: { url: string; w: number; h: number }) {
  const [scale, setScale] = useState(4);
  const px = 32 * scale;
  return <div className="tile-preview">
    <div className="tile-plane" style={{ backgroundImage: `url(${url})`, backgroundSize: `${px}px ${px * h / w}px` }} />
    <label className="tile-control">タイルサイズ<input aria-label="タイルサイズ" type="range" min={1} max={8} value={scale} onChange={(e) => setScale(Number(e.target.value))} /><span>{px}px</span></label>
  </div>;
}