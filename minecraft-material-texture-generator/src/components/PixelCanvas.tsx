import { useEffect, useRef, useCallback } from 'react';
import { drawPixels, type Pixels } from '../lib/render';

interface Props {
  pixels: Pixels;
  scale: number;
  className?: string;
  grid?: boolean;
  onPaint?: (index: number, erase: boolean) => void;
  title?: string;
}

export default function PixelCanvas({ pixels, scale, className, grid, onPaint, title }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const painting = useRef(false);
  const erasing = useRef(false);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    drawPixels(c, pixels, scale);
    if (grid && scale >= 8) {
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 16; i++) {
        ctx.beginPath();
        ctx.moveTo(i * scale + 0.5, 0);
        ctx.lineTo(i * scale + 0.5, 16 * scale);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * scale + 0.5);
        ctx.lineTo(16 * scale, i * scale + 0.5);
        ctx.stroke();
      }
    }
  }, [pixels, scale, grid]);

  const idxFromEvent = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * 16);
    const y = Math.floor(((e.clientY - r.top) / r.height) * 16);
    if (x < 0 || y < 0 || x > 15 || y > 15) return -1;
    return y * 16 + x;
  }, []);

  const handlers = onPaint
    ? {
        onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => {
          e.preventDefault();
          painting.current = true;
          erasing.current = e.button === 2 || e.shiftKey;
          ref.current?.setPointerCapture(e.pointerId);
          const i = idxFromEvent(e);
          if (i >= 0) onPaint(i, erasing.current);
        },
        onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => {
          if (!painting.current) return;
          const i = idxFromEvent(e);
          if (i >= 0) onPaint(i, erasing.current);
        },
        onPointerUp: () => {
          painting.current = false;
        },
        onPointerCancel: () => {
          painting.current = false;
        },
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      }
    : {};

  return (
    <canvas
      ref={ref}
      title={title}
      className={className}
      style={{ imageRendering: 'pixelated', width: 16 * scale, height: 16 * scale, touchAction: 'none' }}
      {...handlers}
    />
  );
}
