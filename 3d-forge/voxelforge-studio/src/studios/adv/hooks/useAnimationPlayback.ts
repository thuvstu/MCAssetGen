"use client";

import { useEffect, useState } from "react";

/** Minecraft ticks run at 20 TPS, therefore one tick is 50ms. */
export function useAnimationPlayback(frameCount: number, frametime: number, onAdvance: () => void) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (frameCount < 2) {
      setPlaying(false);
      return;
    }
    if (!playing) return;
    const delay = Math.max(1, frametime) * 50;
    const timer = window.setInterval(onAdvance, delay);
    return () => window.clearInterval(timer);
  }, [frameCount, frametime, onAdvance, playing]);

  return { playing, setPlaying, toggle: () => setPlaying((value) => !value) };
}
