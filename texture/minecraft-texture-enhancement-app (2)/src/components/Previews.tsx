import { useEffect, useRef, useState } from 'react';

export function Block3D({ url, item }: { url: string; item: boolean }) {
  const [rot, setRot] = useState({ x: -24, y: 40 });
  const [auto, setAuto] = useState(true);
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);

  useEffect(() => {
    if (!auto) return;
    let raf = 0, last = performance.now();
    const loop = (t: number) => {
      const dt = t - last;
      last = t;
      if (!drag.current) setRot((r) => ({ ...r, y: r.y + dt * 0.03 }));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [auto]);

  const S = 120;
  const face = (transform: string, shade: number) => (
    <div className="absolute inset-0" style={{ transform, backfaceVisibility: 'hidden' }}>
      <img src={url} alt="" className="w-full h-full" style={{ imageRendering: 'pixelated' }} draggable={false} />
      <div className="absolute inset-0 bg-black" style={{ opacity: shade }} />
    </div>
  );

  return (
    <div className="relative">
      <div
        className="h-52 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        style={{ perspective: 600 }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, rx: rot.x, ry: rot.y };
          (e.target as Element).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          setRot({ x: Math.max(-89, Math.min(89, d.rx - (e.clientY - d.y) * 0.5)), y: d.ry + (e.clientX - d.x) * 0.5 });
        }}
        onPointerUp={() => (drag.current = null)}
      >
        <div
          className="relative"
          style={{ width: S, height: S, transformStyle: 'preserve-3d', transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
        >
          {item ? (
            Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="absolute inset-0" style={{ transform: `translateZ(${(i - 3) * 1.2}px)` }}>
                <img src={url} alt="" className="w-full h-full" style={{ imageRendering: 'pixelated', filter: i === 6 || i === 0 ? 'none' : 'brightness(0.55)' }} draggable={false} />
              </div>
            ))
          ) : (
            <>
              {face(`translateZ(${S / 2}px)`, 0.12)}
              {face(`rotateY(180deg) translateZ(${S / 2}px)`, 0.3)}
              {face(`rotateY(90deg) translateZ(${S / 2}px)`, 0.25)}
              {face(`rotateY(-90deg) translateZ(${S / 2}px)`, 0.2)}
              {face(`rotateX(90deg) translateZ(${S / 2}px)`, 0)}
              {face(`rotateX(-90deg) translateZ(${S / 2}px)`, 0.45)}
            </>
          )}
        </div>
      </div>
      <button
        onClick={() => setAuto((a) => !a)}
        className="absolute top-1 right-1 text-[10px] px-2 py-0.5 bg-black/50 hover:bg-black/80 rounded"
      >
        {auto ? '⏸ 回転停止' : '▶ 自動回転'}
      </button>
    </div>
  );
}

export function TilePreview({ url, w, h, bg }: { url: string; w: number; h: number; bg: string }) {
  const [scale, setScale] = useState(3);
  const px = Math.max(8, Math.round((48 * scale) / 3));
  return (
    <div>
      <div
        className="h-52 rounded border-2 border-black"
        style={{
          backgroundColor: bg,
          backgroundImage: `url(${url})`,
          backgroundSize: `${px}px ${Math.round((px * h) / w)}px`,
          imageRendering: 'pixelated',
        }}
      />
      <input type="range" min={1} max={8} value={scale} onChange={(e) => setScale(+e.target.value)} className="w-full mt-1 accent-lime-500" />
    </div>
  );
}
