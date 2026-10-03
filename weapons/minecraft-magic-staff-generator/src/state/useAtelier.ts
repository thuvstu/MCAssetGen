import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Config } from "../engine/data";
import { applyLock, autoGenerate, DEFAULT_CONFIG, type LockMap, type LockMode } from "../engine/generator";
import type { Category } from "../engine/labels";

const HISTORY_LIMIT = 32;
const RAIL_LIMIT = 18;
const FAVORITE_LIMIT = 24;
const STORAGE_KEY = "spellforge.atelier.v1";

export type Toast = { id: number; text: string; tone: "ok" | "warn" | "info" };
export type Favorite = { id: string; config: Config; savedAt: number };
export type PackSettings = {
  version: string;
  target: "vanilla" | "cit" | "custom";
  itemId: string;
  namespace: string;
  customModelData: number;
  emissive: boolean;
  lang: boolean;
  model: boolean;
  interpolate: boolean;
};

export const DEFAULT_PACK: PackSettings = {
  version: "1.21.4", target: "vanilla", itemId: "blaze_rod", namespace: "spellforge",
  customModelData: 1001, emissive: true, lang: true, model: true, interpolate: true,
};

function readStorage(): { favorites: Favorite[]; pack: PackSettings } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { favorites: [], pack: DEFAULT_PACK };
    const parsed = JSON.parse(raw) as { favorites?: Favorite[]; pack?: PackSettings };
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites.slice(0, FAVORITE_LIMIT) : [],
      pack: { ...DEFAULT_PACK, ...(parsed.pack ?? {}) },
    };
  } catch {
    return { favorites: [], pack: DEFAULT_PACK };
  }
}

export function useAtelier(initialConfig: Config) {
  const stored = useRef(readStorage());
  const [config, setConfig] = useState<Config>(initialConfig);
  const [past, setPast] = useState<Config[]>([]);
  const [future, setFuture] = useState<Config[]>([]);
  const [rail, setRail] = useState<{ config: Config; at: number }[]>([{ config: initialConfig, at: Date.now() }]);
  const [locks, setLocks] = useState<LockMap>({});
  const [favorites, setFavorites] = useState<Favorite[]>(stored.current.favorites);
  const [pack, setPack] = useState<PackSettings>(stored.current.pack);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [revision, setRevision] = useState(0);

  const notify = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 2600);
  }, []);

  /** Commit a new configuration, pushing the previous one onto the undo stack. */
  const commit = useCallback((next: Config | ((prev: Config) => Config)) => {
    setConfig((prev) => {
      const value = typeof next === "function" ? (next as (p: Config) => Config)(prev) : next;
      if (value === prev) return prev;
      setPast((stack) => [...stack.slice(-HISTORY_LIMIT + 1), prev]);
      setFuture([]);
      setRail((items) => [{ config: value, at: Date.now() }, ...items].slice(0, RAIL_LIMIT));
      return value;
    });
  }, []);

  const patch = useCallback(<K extends keyof Config>(key: K, value: Config[K]) => {
    commit((prev) => ({ ...prev, [key]: value }));
  }, [commit]);

  const undo = useCallback(() => {
    setPast((stack) => {
      if (!stack.length) return stack;
      const previous = stack[stack.length - 1];
      setConfig((current) => { setFuture((f) => [current, ...f].slice(0, HISTORY_LIMIT)); return previous; });
      return stack.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((stack) => {
      if (!stack.length) return stack;
      const next = stack[0];
      setConfig((current) => { setPast((p) => [...p.slice(-HISTORY_LIMIT + 1), current]); return next; });
      return stack.slice(1);
    });
  }, []);

  const jumpTo = useCallback((target: Config) => commit(target), [commit]);

  const generate = useCallback(() => {
    commit((prev) => autoGenerate(prev, { locks }));
    setRevision((n) => n + 1);
  }, [commit, locks]);

  const setLockMode = useCallback((category: Category, mode: LockMode) => {
    setLocks((current) => applyLock(current, category, mode));
  }, []);

  const toggleFavorite = useCallback(() => {
    const id = `${config.seed}-${config.type}-${config.element}-${Date.now().toString(36)}`;
    const already = favorites.some((f) => f.config.seed === config.seed && f.config.name === config.name && f.config.type === config.type);
    if (already) {
      setFavorites((list) => list.filter((f) => !(f.config.seed === config.seed && f.config.name === config.name && f.config.type === config.type)));
      notify("お気に入りから外しました", "info");
      return;
    }
    setFavorites((list) => [{ id, config, savedAt: Date.now() }, ...list].slice(0, FAVORITE_LIMIT));
    notify(`「${config.name || "レリック"}」を保存しました`);
  }, [config, favorites, notify]);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((list) => list.filter((f) => f.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    commit({ ...DEFAULT_CONFIG, name: "" });
    setLocks({});
    notify("初期状態に戻しました", "info");
  }, [commit, notify]);

  // Persist favorites and pack settings so a session survives reloads.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ favorites, pack }));
    } catch {
      /* storage unavailable — favorites simply won't persist */
    }
  }, [favorites, pack]);

  const isFavorite = useMemo(
    () => favorites.some((f) => f.config.seed === config.seed && f.config.name === config.name && f.config.type === config.type),
    [favorites, config],
  );

  const lockedOnly = useMemo(() => (Object.keys(locks) as Category[]).find((k) => locks[k] === "only") ?? null, [locks]);
  const lockedKeepCount = useMemo(() => Object.values(locks).filter((m) => m === "keep").length, [locks]);

  return {
    config, commit, patch, setConfig: commit, generate,
    past, future, undo, redo, rail, jumpTo, revision,
    locks, setLocks, setLockMode, lockedOnly, lockedKeepCount,
    favorites, isFavorite, toggleFavorite, removeFavorite, resetAll,
    pack, setPack, toasts, notify,
  };
}

export type Atelier = ReturnType<typeof useAtelier>;
