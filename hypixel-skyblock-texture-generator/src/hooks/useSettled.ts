import { useEffect, useState } from 'react';

/**
 * Returns `value` only once it has stopped changing for `delay` ms.
 * Used for secondary previews so continuous drags keep the main canvas at full speed.
 * (useDeferredValue cannot interrupt synchronous canvas work inside memos/effects.)
 */
export function useSettled<T>(value: T, delay: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (Object.is(value, settled)) return;
    const id = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay, settled]);
  return settled;
}
