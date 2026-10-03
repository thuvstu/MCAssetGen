/* ═══════════════════════════════════════════════════════
   useForge — single source of truth for the atelier
   (config · history · 🔒 locks · 🎯 rules · actions)
   ═══════════════════════════════════════════════════════ */
import React from 'react';
import type { AnimationConfig, ElementType, ItemType, StaffConfig } from '../lib/types';
import { DEFAULT_ANIMATION, DEFAULT_CONFIG } from '../lib/defaults';
import { applyElement } from '../lib/catalog/elements';
import { applyItemType } from '../lib/catalog/itemTypes';
import { EFFECT_PRESETS, PRESETS } from '../lib/catalog/presets';
import { FINIAL_PRESETS } from '../lib/catalog/finials';
import { randomConfig } from '../lib/random';
import {
  DEFAULT_RULES, LockKey, Locks, RandomRules, countLocked, locksExcept, withLocks,
} from '../lib/locks';

export interface ForgeApi {
  config: StaffConfig;
  anim: AnimationConfig;
  isAnimated: boolean;
  history: StaffConfig[];
  /** curated set of designs destined for one multiplayer server resource pack */
  collection: StaffConfig[];
  addToCollection: () => void;
  removeFromCollection: (index: number) => void;
  clearCollection: () => void;
  locks: Locks;
  rules: RandomRules;
  lockedCount: number;
  toast: string | null;

  update: (patch: Partial<StaffConfig>) => void;
  setAnim: (patch: Partial<AnimationConfig>) => void;
  replace: (cfg: StaffConfig) => void;
  reset: () => void;

  randomAll: () => void;
  /** Randomize only these keys; everything else stays. `rules` override per call. */
  randomizeOnly: (keys: LockKey[], rules?: Partial<RandomRules>) => void;
  reseed: () => void;

  applyElementId: (id: ElementType) => void;
  applyTypeId: (id: ItemType) => void;
  applyEffect: (index: number) => void;
  applyPreset: (index: number) => void;
  applyFinial: (index: number) => void;

  isLocked: (key: LockKey) => boolean;
  toggleLock: (key: LockKey) => void;
  setLocks: (keys: LockKey[], on: boolean) => void;
  clearLocks: () => void;
  setRules: (patch: Partial<RandomRules>) => void;

  flash: (msg: string) => void;
}

export const ForgeContext = React.createContext<ForgeApi | null>(null);

export function useForge(): ForgeApi {
  const api = React.useContext(ForgeContext);
  if (!api) throw new Error('useForge must be used inside <ForgeContext.Provider>');
  return api;
}

export function useForgeState(): ForgeApi {
  const [config, setConfig] = React.useState<StaffConfig>(DEFAULT_CONFIG);
  const [history, setHistory] = React.useState<StaffConfig[]>([]);
  const [collection, setCollection] = React.useState<StaffConfig[]>([]);
  const [locks, setLocksState] = React.useState<Locks>({});
  const [rules, setRulesState] = React.useState<RandomRules>(DEFAULT_RULES);
  const [toast, setToast] = React.useState<string | null>(null);
  const toastTimer = React.useRef<number | null>(null);

  const flash = React.useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }, []);

  const pushHistory = React.useCallback((cfg: StaffConfig) => {
    setHistory((h) => [cfg, ...h].slice(0, 8));
  }, []);

  /** Apply a transition and remember where we came from. */
  const commit = React.useCallback((fn: (prev: StaffConfig) => StaffConfig) => {
    setConfig((prev) => { pushHistory(prev); return fn(prev); });
  }, [pushHistory]);

  const update = React.useCallback((patch: Partial<StaffConfig>) => setConfig((c) => ({ ...c, ...patch })), []);
  const setAnim = React.useCallback((patch: Partial<AnimationConfig>) =>
    setConfig((c) => ({ ...c, animation: { ...(c.animation ?? DEFAULT_ANIMATION), ...patch } })), []);

  const api: ForgeApi = {
    config,
    anim: config.animation ?? DEFAULT_ANIMATION,
    isAnimated: (config.animation?.type ?? 'none') !== 'none',
    history, locks, rules,
    lockedCount: countLocked(locks),
    toast,
    collection,
    addToCollection: () => setCollection((c) => [...c.slice(-11), { ...config }]),
    removeFromCollection: (i) => setCollection((c) => c.filter((_, idx) => idx !== i)),
    clearCollection: () => setCollection([]),

    update, setAnim,
    replace: (cfg) => commit(() => cfg),
    reset: () => commit(() => ({ ...DEFAULT_CONFIG })),

    randomAll: () => commit((prev) => randomConfig(prev, { locks, rules })),
    randomizeOnly: (keys, ruleOverride) =>
      commit((prev) => randomConfig(prev, { locks: locksExcept(keys, locks), rules: { ...rules, ...(ruleOverride ?? {}) } })),
    reseed: () => update({ seed: Math.floor(Math.random() * 999999) }),

    applyElementId: (id) => commit((c) => ({ ...c, element: id, ...applyElement(id) })),
    applyTypeId: (id) => commit((c) => ({ ...c, itemType: id, ...applyItemType(id) })),
    applyEffect: (i) => commit((c) => ({ ...c, ...EFFECT_PRESETS[i].patch })),
    applyPreset: (i) => commit((c) => ({ ...c, ...PRESETS[i].config, seed: Math.floor(Math.random() * 999999) })),
    applyFinial: (i) => commit((c) => ({ ...c, ...FINIAL_PRESETS[i].patch })),

    isLocked: (key) => !!locks[key],
    toggleLock: (key) => setLocksState((l) => withLocks(l, [key], !l[key])),
    setLocks: (keys, on) => setLocksState((l) => withLocks(l, keys, on)),
    clearLocks: () => setLocksState({}),
    setRules: (patch) => setRulesState((r) => ({ ...r, ...patch })),

    flash,
  };
  return api;
}
