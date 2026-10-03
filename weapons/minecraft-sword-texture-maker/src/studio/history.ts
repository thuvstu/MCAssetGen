export type HistoryState<T> = {
  past: T[]; present: T; future: T[];
  lastGroup: string | null; lastAt: number;
};
export type HistoryAction<T> =
  | { type: "commit"; next: T; group?: string; at: number }
  | { type: "undo" }
  | { type: "redo" };

export function createHistory<T>(present: T): HistoryState<T> {
  return { past: [], present, future: [], lastGroup: null, lastAt: 0 };
}

export function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  if (action.type === "undo") {
    if (!state.past.length) return state;
    return { past: state.past.slice(0, -1), present: state.past[state.past.length - 1],
      future: [state.present, ...state.future], lastGroup: null, lastAt: 0 };
  }
  if (action.type === "redo") {
    if (!state.future.length) return state;
    return { past: [...state.past, state.present], present: state.future[0],
      future: state.future.slice(1), lastGroup: null, lastAt: 0 };
  }
  if (JSON.stringify(action.next) === JSON.stringify(state.present)) return state;
  const coalesce = !!action.group && action.group === state.lastGroup && action.at - state.lastAt < 450 && !state.future.length;
  return {
    past: coalesce ? state.past : [...state.past, state.present].slice(-80),
    present: action.next, future: [], lastGroup: action.group ?? null, lastAt: action.at,
  };
}