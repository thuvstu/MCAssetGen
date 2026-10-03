"use client";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";

interface History<T> { past: T[]; present: T; future: T[] }
export function historyStep<T>(history: History<T>, direction: "undo" | "redo"): History<T> {
  if (direction === "undo") {
    if (!history.past.length) return history;
    return { past: history.past.slice(0, -1), present: history.past[history.past.length - 1], future: [history.present, ...history.future] };
  }
  if (!history.future.length) return history;
  return { past: [...history.past, history.present], present: history.future[0], future: history.future.slice(1) };
}
/** One slider drag is one undo step; independent clicks are independent undo steps. */
export function useHistory<T>(initial: T, limit = 60) {
  const [history, setHistory] = useState<History<T>>({ past: [], present: initial, future: [] });
  const grouping = useRef(false);
  const grouped = useRef(false);
  const begin = useCallback(() => { if (!grouping.current) { grouping.current = true; grouped.current = false; } }, []);
  const end = useCallback(() => { grouping.current = false; grouped.current = false; }, []);
  useEffect(() => {
    window.addEventListener("pointerup", end); window.addEventListener("pointercancel", end); window.addEventListener("keyup", end);
    return () => { window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end); window.removeEventListener("keyup", end); };
  }, [end]);
  const set = useCallback((action: SetStateAction<T>) => {
    const keepPast = grouping.current && grouped.current;
    if (grouping.current) grouped.current = true;
    setHistory(current => {
      const value = typeof action === "function" ? (action as (value: T) => T)(current.present) : action;
      if (JSON.stringify(value) === JSON.stringify(current.present)) return current;
      return { past: keepPast ? current.past : [...current.past, current.present].slice(-limit), present: value, future: [] };
    });
  }, [limit]);
  const undo = useCallback(() => { end(); setHistory(current => historyStep(current, "undo")); }, [end]);
  const redo = useCallback(() => { end(); setHistory(current => historyStep(current, "redo")); }, [end]);
  const replace = useCallback((value: T) => { end(); setHistory({ past: [], present: value, future: [] }); }, [end]);
  return { value: history.present, set, undo, redo, replace, canUndo: history.past.length > 0, canRedo: history.future.length > 0, begin, end };
}
