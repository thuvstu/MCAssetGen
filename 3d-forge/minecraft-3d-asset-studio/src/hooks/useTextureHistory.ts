"use client";

import { useCallback, useState } from "react";

interface TextureHistory {
  entries: string[];
  index: number;
}

const MAX_HISTORY_ENTRIES = 30;

export function useTextureHistory(initialTexture: string = "") {
  const [history, setHistory] = useState<TextureHistory>({
    entries: initialTexture ? [initialTexture] : [],
    index: initialTexture ? 0 : -1,
  });

  const reset = useCallback((texture: string) => {
    setHistory({ entries: texture ? [texture] : [], index: texture ? 0 : -1 });
  }, []);

  const record = useCallback((texture: string) => {
    if (!texture) return;

    setHistory((current) => {
      if (current.entries[current.index] === texture) return current;

      const entries = [...current.entries.slice(0, current.index + 1), texture].slice(-MAX_HISTORY_ENTRIES);
      return { entries, index: entries.length - 1 };
    });
  }, []);

  const undo = useCallback((): string | null => {
    if (history.index <= 0) return null;
    const nextIndex = history.index - 1;
    setHistory((current) => ({ ...current, index: nextIndex }));
    return history.entries[nextIndex];
  }, [history]);

  const redo = useCallback((): string | null => {
    if (history.index >= history.entries.length - 1) return null;
    const nextIndex = history.index + 1;
    setHistory((current) => ({ ...current, index: nextIndex }));
    return history.entries[nextIndex];
  }, [history]);

  return {
    canUndo: history.index > 0,
    canRedo: history.index >= 0 && history.index < history.entries.length - 1,
    undo,
    redo,
    reset,
    record,
  };
}
