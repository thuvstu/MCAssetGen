import { useEffect, useRef } from 'react';

export function paint(c: HTMLCanvasElement | null, rgba: Uint8ClampedArray, n: number) {
  if (!c) return;
  if (c.width !== n || c.height !== n) {
    c.width = n;
    c.height = n;
  }
  const ctx = c.getContext('2d');
  if (!ctx) return;
  const img = ctx.createImageData(n, n);
  img.data.set(rgba);
  ctx.putImageData(img, 0, 0);
}

export function Pix({ rgba, n, className = '' }: { rgba: Uint8ClampedArray; n: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => paint(ref.current, rgba, n), [rgba, n]);
  return <canvas ref={ref} className={`crisp ${className}`} />;
}

/** Plays a Minecraft animation strip at its real speed (1 tick = 50 ms). */
export function AnimPix({
  frames,
  n,
  frametime,
  className = '',
  onFrame,
}: {
  frames: Uint8ClampedArray[];
  n: number;
  frametime: number;
  className?: string;
  onFrame?: (f: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let f = 0;
    paint(ref.current, frames[0], n);
    onFrame?.(0);
    if (frames.length < 2) return;
    const id = window.setInterval(() => {
      f = (f + 1) % frames.length;
      paint(ref.current, frames[f], n);
      onFrame?.(f);
    }, Math.max(1, frametime) * 50);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, n, frametime]);
  return <canvas ref={ref} className={`crisp ${className}`} />;
}
