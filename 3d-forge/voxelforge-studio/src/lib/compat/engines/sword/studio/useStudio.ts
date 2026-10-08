import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { DEFAULT_OPTIONS, DETAIL_PRESETS, normalizeOptions, optionsForPreset } from "../engine/options";
import { PRESETS, TIER_CONFIG } from "../engine/presets";
import type { Palette, SwordOptions } from "../engine/types";
import { GROUP_IDS, createRecipe, parseRecipe } from "../generator/catalog";
import type { GroupId, Recipe } from "../generator/catalog";
import { generateSword } from "../generator/generate";
import type { GenerationReport, GenerationResult } from "../generator/generate";
import { createHistory, historyReducer } from "./history";
import { sanitizeName } from "../utils/names";

export type StudioDocument = { options: SwordOptions; name: string; presetKey: string; tier: string; report: GenerationReport | null };
const SESSION_KEY = "aegis.studio.v4";
const RECIPE_KEY = "aegis.recipe.v1";
const CUSTOM_KEY = "aegis_custom_presets";
const read = (key: string): unknown => {
  try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; }
};
function loadDocument(): StudioDocument {
  const defaults: StudioDocument = { options: { ...DEFAULT_OPTIONS, palette: { ...DEFAULT_OPTIONS.palette } }, name: "frostbound_edge", presetKey: "Custom", tier: "Rare", report: null };
  const data = read(SESSION_KEY) as Partial<StudioDocument> | null;
  if (!data || typeof data !== "object" || !data.options) return defaults;
  return { ...defaults, options: normalizeOptions(data.options),
    name: typeof data.name === "string" ? sanitizeName(data.name) : defaults.name,
    tier: typeof data.tier === "string" && TIER_CONFIG[data.tier] ? data.tier : defaults.tier,
    presetKey: typeof data.presetKey === "string" && PRESETS[data.presetKey] ? data.presetKey : "Custom" };
}
function loadCustom(): Record<string, SwordOptions> {
  const value = read(CUSTOM_KEY);
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, SwordOptions> = {};
  for (const [key, options] of Object.entries(value).slice(0, 50)) {
    if (options && typeof options === "object" && "palette" in options) out[sanitizeName(key) || "custom"] = normalizeOptions(options);
  }
  return out;
}
const nextSeed = () => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) return crypto.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 4294967296);
};

export function useStudio() {
  const [state, dispatch] = useReducer(historyReducer<StudioDocument>, undefined, () => createHistory(loadDocument()));
  const [recipe, setRecipe] = useState<Recipe>(() => parseRecipe(read(RECIPE_KEY)));
  const [customPresets, setCustomPresets] = useState(loadCustom);
  const [candidates, setCandidates] = useState<GenerationResult[]>([]);
  const [message, setMessage] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [seedInput, setSeedInput] = useState("");
  const [fixedSeed, setFixedSeed] = useState(false);
  const document = state.present;
  const opts = document.options;
  const latest = useRef({ document, recipe, seedInput, fixedSeed });
  latest.current = { document, recipe, seedInput, fixedSeed };
  const seedValid = !fixedSeed || (/^\d+$/.test(seedInput) && Number(seedInput) <= 4294967295);
  const allLocked = GROUP_IDS.every((id) => recipe.groups[id].mode === "keep");
  const notify = useCallback((text: string) => setMessage(text), []);

  useEffect(() => {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(document)); localStorage.setItem(RECIPE_KEY, JSON.stringify(recipe)); }
    catch { setStorageError(true); }
  }, [document, recipe]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);

  const commit = (next: StudioDocument, group?: string) => dispatch({ type: "commit", next, group, at: performance.now() });
  const update = (patch: Partial<SwordOptions>) => {
    const p = patch.detailLevel ? { ...DETAIL_PRESETS[patch.detailLevel], ...patch } : patch;
    setCandidates([]);
    commit({ ...document, presetKey: "Custom", report: null, options: normalizeOptions({ ...opts, ...p }) }, Object.keys(p).sort().join("|"));
  };
  const setPaletteField = (patch: Partial<Palette>) => update({ palette: { ...opts.palette, ...patch } });
  const setName = (name: string) => commit({ ...document, name: sanitizeName(name) }, "name");
  const setTier = (tier: string) => commit({ ...document, tier }, "tier");
  const applyPreset = (key: string) => {
    if (!PRESETS[key]) return;
    setCandidates([]);
    commit({ options: optionsForPreset(key, opts), name: sanitizeName(key), tier: PRESETS[key].tier, presetKey: key, report: null });
  };
  const applyCustom = (key: string) => {
    if (!customPresets[key]) return;
    setCandidates([]);
    commit({ ...document, options: normalizeOptions(customPresets[key]), name: key, presetKey: "Custom", report: null });
  };
  const persistCustom = (next: Record<string, SwordOptions>) => {
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(next)); setCustomPresets(next); return true; }
    catch { notify("保存できませんでした。ブラウザの保存領域をご確認ください。"); return false; }
  };
  const saveCustom = () => {
    const name = document.name || "custom";
    if (persistCustom({ ...customPresets, [name]: normalizeOptions(opts) })) notify(`「${name}」を保存しました。`);
  };
  const deleteCustom = (key: string) => {
    const next = { ...customPresets }; delete next[key]; persistCustom(next);
  };
  const changeRecipe = (next: Recipe) => { setRecipe(parseRecipe(next)); setCandidates([]); };
  const resetRecipe = () => changeRecipe(createRecipe());
  const applyCandidate = (result: GenerationResult) => {
    commit({ ...document, options: result.options, name: result.name, presetKey: "Custom", report: result.report });
  };
  const generate = async (scope?: GroupId[], count = 1) => {
    if (generating || !seedValid || allLocked) return;
    setGenerating(true);
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (latest.current.document !== document || latest.current.recipe !== recipe || latest.current.seedInput !== seedInput || latest.current.fixedSeed !== fixedSeed) {
        notify("設定が変更されたため生成を中止しました。新しい設定で再度生成してください。");
        return;
      }
      const seed = fixedSeed ? Number(seedInput) : nextSeed();
      const results = Array.from({ length: count }, (_, i) => generateSword(opts, recipe, (seed + i * 7919) >>> 0, scope));
      if (count > 1) {
        setCandidates(results);
        notify("4つの候補を作成しました。プレビュー下の候補を選んで適用できます。");
      } else {
        setCandidates([]);
        if (!results[0].report.changed.length) notify("指定された内容と現在の設定は同じです。別の部位をおまかせにすると変化します。");
        else {
          applyCandidate(results[0]);
          notify(`${results[0].report.changed.length}項目を生成しました。固定した項目は変更していません。`);
        }
      }
    } catch (error) {
      notify(error instanceof Error ? `生成できませんでした: ${error.message}` : "生成できませんでした。設定をご確認ください。");
    } finally { setGenerating(false); }
  };
  const undo = () => { dispatch({ type: "undo" }); setCandidates([]); };
  const redo = () => { dispatch({ type: "redo" }); setCandidates([]); };

  return { document, opts, recipe, changeRecipe, resetRecipe, update, setPaletteField, setName, setTier,
    applyPreset, applyCustom, customPresets, saveCustom, deleteCustom,
    generating, generate, candidates, applyCandidate, fixedSeed, setFixedSeed, seedInput, setSeedInput, seedValid, allLocked,
    undo, redo, canUndo: !!state.past.length, canRedo: !!state.future.length,
    isCustomSaved: JSON.stringify(customPresets[document.name || "custom"]) === JSON.stringify(opts),
    message, notify, storageError,
  };
}