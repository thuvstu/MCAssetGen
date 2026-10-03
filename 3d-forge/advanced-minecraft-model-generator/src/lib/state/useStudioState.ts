"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import {
  AnimationMode,
  GeneratorConfig,
  LimitBreakLevel,
  ModelCategory,
  TacticalMode,
  UpgradeTier,
  WeaponForm,
} from "@/lib/types";
import {
  CATEGORY_DEFAULTS,
  DEFAULT_CONFIG,
  deriveTieredConfig,
  LEGENDARY_PRESETS,
  LegendaryPreset,
  TACTICAL_MODES,
  WEAPON_FORMS,
} from "@/lib/themes";
import { randomSeed } from "@/lib/color";
import { generateModel } from "@/lib/generator";

interface State {
  config: GeneratorConfig;
  past: GeneratorConfig[];
  future: GeneratorConfig[];
  lastKey?: string;
}

type Action =
  | { type: "update"; patch: Partial<GeneratorConfig>; coalesceKey?: string }
  | { type: "replace"; config: GeneratorConfig }
  | { type: "undo" }
  | { type: "redo" };

const HISTORY_LIMIT = 60;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "update": {
      const next = { ...state.config, ...action.patch };
      const coalesce = action.coalesceKey;
      const sameKey = coalesce && state.lastKey === coalesce;
      if (coalesce && !sameKey) {
        const past = [...state.past, state.config].slice(-HISTORY_LIMIT);
        return { ...state, config: next, past, future: [], lastKey: coalesce };
      }
      if (coalesce && sameKey) {
        return { ...state, config: next, future: [] };
      }
      const past = [...state.past, state.config].slice(-HISTORY_LIMIT);
      return { ...state, config: next, past, future: [], lastKey: undefined };
    }
    case "replace":
      return {
        config: { ...DEFAULT_CONFIG, ...action.config },
        past: [...state.past, state.config].slice(-HISTORY_LIMIT),
        future: [],
        lastKey: undefined,
      };
    case "undo": {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        config: previous,
        past: state.past.slice(0, -1),
        future: [state.config, ...state.future],
        lastKey: undefined,
      };
    }
    case "redo": {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return {
        ...state,
        config: next,
        past: [...state.past, state.config].slice(-HISTORY_LIMIT),
        future: rest,
        lastKey: undefined,
      };
    }
    default:
      return state;
  }
}

export function useStudioState() {
  const [state, dispatch] = useReducer(reducer, {
    config: DEFAULT_CONFIG,
    past: [],
    future: [],
  });

  const update = useCallback(
    (patch: Partial<GeneratorConfig>, coalesceKey?: string) =>
      dispatch({ type: "update", patch, coalesceKey }),
    []
  );
  const replace = useCallback(
    (config: GeneratorConfig) => dispatch({ type: "replace", config }),
    []
  );
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  const applyPreset = useCallback(
    (preset: LegendaryPreset) =>
      replace({
        ...DEFAULT_CONFIG,
        ... state.config,
        ...preset.config,
        name: preset.nameJa,
        category: preset.category,
        theme: preset.theme,
        customPalette: undefined,
      }),
    [replace, state.config]
  );

  const applyCategory = useCallback(
    (category: ModelCategory) =>
      replace({
        ...state.config,
        category,
        ...CATEGORY_DEFAULTS[category],
        customPalette: undefined,
      }),
    [replace, state.config]
  );

  const setUpgradeTier = useCallback(
    (tier: UpgradeTier) => {
      const next = deriveTieredConfig(state.config, tier, state.config.limitBreak);
      replace(next);
    },
    [replace, state.config]
  );

  const setLimitBreak = useCallback(
    (level: LimitBreakLevel) => {
      const tier = level > 0 && state.config.upgradeTier < 5 ? 5 : state.config.upgradeTier;
      const next = deriveTieredConfig(state.config, tier, level);
      replace({
        ...next,
        animationEnabled: true,
        animationMode: level > 0 ? "limit_burst" : state.config.animationMode,
      });
    },
    [replace, state.config]
  );

  const setWeaponForm = useCallback(
    (weaponForm: WeaponForm) => {
      update({
        weaponForm,
        animationEnabled: true,
        animationMode: weaponForm === "liberated" ? "form_morph" : state.config.animationMode,
      });
    },
    [update, state.config.animationMode]
  );

  const setTacticalMode = useCallback(
    (tacticalMode: TacticalMode) => {
      update({ tacticalMode });
    },
    [update]
  );

  const triggerAnimation = useCallback(
    (animationMode: AnimationMode) => {
      update({ animationEnabled: animationMode !== "off", animationMode });
    },
    [update]
  );

  const randomize = useCallback(() => {
    const cats: ModelCategory[] = [
      "sword",
      "greatsword",
      "dagger",
      "scythe",
      "axe",
      "staff",
      "spear",
      "bow",
      "shield",
      "armor_helmet",
      "armor_wings",
      "relic_crystal",
      "relic_grimoire",
      "totem",
    ];
    const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
    const category = pick(cats);
    const preset = pick(LEGENDARY_PRESETS);
    const tier = pick([2, 3, 4, 5] as const);
    const lb = pick([0, 0, 1, 2] as const);
    const form = pick(["standard", "standard", "sealed", "liberated", "twin_fang", "colossus"] as const);
    const mode = pick(["normal", "overdrive", "soul_devour", "absolute_zero", "thunder_clad", "divine_aegis"] as const);

    const titles = [
      "時空穿ちの魔剣",
      "星辰の導き杖",
      "魔王の真紅大鎌",
      "神聖覇王の光輪",
      "深淵喰らいの戦斧",
      "極光氷結の短剣",
      "怨霊召喚の禁書",
      "冥界の骨翼",
      "雷神の楔",
      "禁忌の原初コア",
      "翠霊の長弓",
      "穿貫の魔槍",
      "赤石の統制盾",
    ];

    const baseCfg: GeneratorConfig = {
      ...state.config,
      ...CATEGORY_DEFAULTS[category],
      name: pick(titles),
      category,
      theme: preset.theme,
      upgradeTier: tier,
      limitBreak: lb,
      weaponForm: form,
      tacticalMode: mode,
      crossguardStyle: preset.config.crossguardStyle ?? state.config.crossguardStyle,
      bladeEdgeStyle: pick(["straight", "serrated", "crystal_spikes", "curved", "flame_wavy", "split"] as const),
      bladeProfile: pick(["flat", "bevel", "fuller", "hexagonal"] as const),
      floatingType: pick(["runes", "crystals", "magic_ring", "orbs", "skulls", "feathers", "stars"] as const),
      floatingCount: 2 + Math.floor(Math.random() * 6),
      floatingRadius: 8 + Math.floor(Math.random() * 10),
      particleEffect: pick(["sparks", "flames", "void_smoke", "frost_crystals", "holy_halo", "electric_arcs", "souls"] as const),
      animationMode: pick([
        "idle_float",
        "orbit_spin",
        "combo_slash",
        "charge_cleave",
        "magic_cast",
        "form_morph",
        "limit_burst",
      ] as AnimationMode[]),
      hasCoreGem: Math.random() > 0.15,
      hasRunicEngravings: Math.random() > 0.3,
      hasEnergyBladeOutline: Math.random() > 0.4,
      hasSpikesOrWings: Math.random() > 0.3,
      seed: randomSeed(),
      customPalette: undefined,
    };

    replace(deriveTieredConfig(baseCfg, tier, lb));
  }, [replace, state.config]);

  const resetPalette = useCallback(() => update({ customPalette: undefined }), [update]);

  // keyboard shortcuts (never while typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const key = e.key.toLowerCase();

      if ((e.metaKey || e.ctrlKey) && key === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (key) {
        case "r":
          e.preventDefault();
          randomize();
          break;
        case " ":
          e.preventDefault();
          update({ animationEnabled: !state.config.animationEnabled });
          break;
        case "[": {
          e.preventDefault();
          const prevTier = Math.max(1, (state.config.upgradeTier || 3) - 1) as UpgradeTier;
          setUpgradeTier(prevTier);
          break;
        }
        case "]": {
          e.preventDefault();
          const nextTier = Math.min(5, (state.config.upgradeTier || 3) + 1) as UpgradeTier;
          setUpgradeTier(nextTier);
          break;
        }
        case "l": {
          e.preventDefault();
          const nextLb = (((state.config.limitBreak || 0) + 1) % 3) as LimitBreakLevel;
          setLimitBreak(nextLb);
          break;
        }
        case "f": {
          e.preventDefault();
          const idx = WEAPON_FORMS.findIndex((w) => w.id === state.config.weaponForm);
          const nextForm = WEAPON_FORMS[(idx + 1) % WEAPON_FORMS.length].id;
          setWeaponForm(nextForm);
          break;
        }
        case "m": {
          e.preventDefault();
          const idx = TACTICAL_MODES.findIndex((m) => m.id === state.config.tacticalMode);
          const nextMode = TACTICAL_MODES[(idx + 1) % TACTICAL_MODES.length].id;
          setTacticalMode(nextMode);
          break;
        }
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
          window.dispatchEvent(new CustomEvent("studio-panel", { detail: key }));
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    randomize,
    undo,
    redo,
    update,
    setUpgradeTier,
    setLimitBreak,
    setWeaponForm,
    setTacticalMode,
    state.config.animationEnabled,
    state.config.upgradeTier,
    state.config.limitBreak,
    state.config.weaponForm,
    state.config.tacticalMode,
  ]);

  const model = useMemo(() => generateModel(state.config), [state.config]);

  return {
    config: state.config,
    model,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    update,
    replace,
    undo,
    redo,
    applyPreset,
    applyCategory,
    setUpgradeTier,
    setLimitBreak,
    setWeaponForm,
    setTacticalMode,
    triggerAnimation,
    randomize,
    resetPalette,
  };
}

export type Studio = ReturnType<typeof useStudioState>;
