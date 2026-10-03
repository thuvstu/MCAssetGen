import { useEffect, useRef } from "react";
import { ANIMATION_SECONDS, renderSword } from "../engine/render";
import type { SwordOptions } from "../engine/types";

export function useSwordPreview(options: SwordOptions, playing: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderSword(canvas, options, timeRef.current);
    if (!playing) return;
    let frame = 0;
    let previous = performance.now();
    let lastDraw = previous;
    const fps = options.size >= 256 ? 15 : 30;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (document.hidden) { previous = now; return; }
      if (now - lastDraw < 1000 / fps) return;
      timeRef.current = (timeRef.current + Math.min(0.15, (now - previous) / 1000)) % ANIMATION_SECONDS;
      previous = now; lastDraw = now;
      renderSword(canvas, options, timeRef.current);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [options, playing]);
  return { canvasRef, timeRef };
}