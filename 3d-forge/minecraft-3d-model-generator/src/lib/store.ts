"use client";
import { create } from "zustand";
import {
  applyPreset,
  applySet,
  defaultParams,
  normalize,
  switchKind,
  type EffectState,
  type Params,
} from "@/lib/forge";
import type { Preset, SetDef } from "@/lib/forge/data";

export type LeftTab = "shape" | "lineage" | "fx" | "color" | "motion";
export type ViewKey = "persp" | "front" | "side" | "top";

export interface LibraryItem {
  id: number;
  name: string;
  kind: string;
  params: Record<string, unknown>;
  thumbnail: string | null;
  createdAt: string;
}

interface ForgeStore {
  params: Params;
  history: Params[];
  future: Params[];
  tab: LeftTab;
  view: ViewKey;
  toast: { id: number; msg: string } | null;
  capture: (() => string | null) | null;
  /** 再生中のクリップ。待機以外は一度だけ再生して戻る */
  clip: string;
  playToken: number;
  activeSet: string | null;
  /** タイムライン手動スクラブ中（0..1）。null なら自動再生 */
  scrub: number | null;
  /** アトラス上でホバー中のネット（3D側の該当要素を光らせる） */
  hoverCell: string | null;

  set: (p: Partial<Params>, opts?: { silent?: boolean }) => void;
  setDeep: <K extends "anim" | "view">(k: K, v: Partial<Params[K]>) => void;
  setEffect: (id: string, v: Partial<EffectState>) => void;
  setKind: (id: string) => void;
  /** 系譜の変更（変身クリップを自動再生） */
  morph: (p: Partial<Params>, msg?: string) => void;
  preset: (pr: Preset) => void;
  applySetPiece: (s: SetDef, kindId?: string) => void;
  load: (raw: unknown, name?: string) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
  setTab: (t: LeftTab) => void;
  setView: (v: ViewKey) => void;
  play: (clip: string) => void;
  endClip: () => void;
  setScrub: (v: number | null) => void;
  setHoverCell: (k: string | null) => void;
  say: (msg: string) => void;
  setCapture: (fn: (() => string | null) | null) => void;
}

const MAX_HISTORY = 60;

export const useForge = create<ForgeStore>((set, get) => {
  const commit = (next: Params, silent = false) => {
    const { params, history } = get();
    if (silent) return set({ params: next });
    set({ params: next, history: [...history, params].slice(-MAX_HISTORY), future: [] });
  };
  return {
    params: defaultParams("sword"),
    history: [],
    future: [],
    tab: "shape",
    view: "persp",
    toast: null,
    capture: null,
    clip: "idle",
    playToken: 0,
    activeSet: null,
    scrub: null,
    hoverCell: null,

    set: (p, o) => commit({ ...get().params, ...p }, o?.silent),
    setDeep: (k, v) => {
      const cur = get().params;
      commit({ ...cur, [k]: { ...cur[k], ...v } } as Params, k === "view");
    },
    setEffect: (id, v) => {
      const cur = get().params;
      commit({ ...cur, effects: { ...cur.effects, [id]: { ...cur.effects[id], ...v } } });
    },
    setKind: (id) => commit(switchKind(get().params, id)),
    morph: (p, msg) => {
      commit({ ...get().params, ...p });
      get().play("transform");
      if (msg) get().say(msg);
    },
    preset: (pr) => {
      commit(applyPreset(get().params, pr));
      set({ activeSet: null });
      get().play("transform");
      get().say(`型録「${pr.name}」を展開しました`);
    },
    applySetPiece: (s, kindId) => {
      commit(applySet(get().params, s, kindId));
      set({ activeSet: s.id });
      get().play("transform");
    },
    load: (raw, name) => {
      commit(normalize(raw, name));
      set({ activeSet: null });
    },
    reset: () => commit(defaultParams(get().params.kind)),
    undo: () => {
      const { history, params, future } = get();
      if (!history.length) return;
      set({ params: history[history.length - 1], history: history.slice(0, -1), future: [params, ...future] });
    },
    redo: () => {
      const { history, params, future } = get();
      if (!future.length) return;
      set({ params: future[0], future: future.slice(1), history: [...history, params] });
    },
    setTab: (tab) => set({ tab }),
    setView: (view) => set({ view }),
    play: (clip) => set((s) => ({ clip, playToken: s.playToken + 1, scrub: null })),
    endClip: () => set({ clip: "idle", scrub: null }),
    setScrub: (scrub) => set({ scrub }),
    setHoverCell: (hoverCell) => set({ hoverCell }),
    say: (msg) => set({ toast: { id: Date.now() + Math.random(), msg } }),
    setCapture: (capture) => set({ capture }),
  };
});
