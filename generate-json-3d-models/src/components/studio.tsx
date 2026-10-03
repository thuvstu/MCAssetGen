"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import {
  ArrowRight, ArrowUpRight, BookOpen, Box, Check, CheckCircle2, ChevronDown, ChevronRight,
  CircleHelp, Code2, Copy, Download, Expand, FileJson, Files, FolderClosed, Grid2X2,
  Grid3X3, ImageIcon, Keyboard, Layers3, LayoutGrid, Loader2, Menu, Minimize, MousePointer2, Pause, Play, Repeat, Wand2,
  Camera, Undo2, Redo2, Palette, Plus, RotateCw, Scan, Search, Settings2, SlidersHorizontal, Sparkles, Terminal, Trash2, X,
} from "lucide-react";
import {
  DEFAULT_SETTINGS, DEFAULT_TAGS, INITIAL_MODEL, PALETTES, TEMPLATES, generateModel, NAMESPACE,
  CATEGORY_LABELS, KIND_INFO, PALETTE_LABELS, analyzePrompt, generateModel as buildDraft, hashString, modelFromSprite, textureWidth, textureHeight, giveCommand, fancyGiveCommand, getModelSize, modelAtStage, poseOf, toMinecraftJson,
  BODY_ANIMS, DECOR_ANIMS, DEFAULT_EXTRAS, TRANSFORM_ANIMS, type AccentId, type DecorId, type EffectId, type Extras,
  type Category, type ModelKind, type ConcretePalette, type GenerationSettings, type ModelTemplate, type PaletteKey, type SavedModel, type VoxelModel,
} from "@/lib/models";
import { downloadTexture, exportModel, type ExportFormat } from "@/lib/export";
import TextureStudio from "./texture-studio";
import { DEFAULT_VOXELIZE, extrusionKey, importImageDataUrl, toModelTexture, voxelizeFromImageData, type ImportedTexture } from "@/lib/atlas";
import DecorEditor from "./decor-editor";
import ExportReport from "./export-report";
import { DEFAULT_CONFIG, configFromSaved, configToTags, designOf, profilesFor, PROFILE_LABELS, stable, type StudioConfig } from "@/lib/configurator";
import { useHistory } from "@/hooks/use-history";
import { KIND_OPTIONS, MATERIAL_OPTIONS, MOTIF_OPTIONS, STYLE_OPTIONS, optionLabel } from "@/lib/type-options";
import type { Blueprint } from "@/lib/prompt";
import { DECOR_OPTIONS, DECOR_CATEGORIES, EFFECT_OPTIONS, STYLE_PRESETS, SLOT_OPTIONS, INTENSITY_OPTIONS, defaultSlot, makeInstance, categoryOf, decoLabel, slotLabel, intensityLabel, hasExtras, normalizeExtras, applyAccent } from "@/lib/decor";
import type { DecorInstance, SlotId } from "@/lib/model-types";
import { BODY_LABELS, DECOR_LABELS, TRANSFORM_LABELS } from "@/lib/animation";
import type { CameraView, ViewerApi } from "./model-viewer";
import ModelThumbnail from "./model-thumbnail";

const ModelViewer = dynamic(() => import("./model-viewer"), { ssr: false, loading: () => <div className="viewer-loading"><Loader2 size={24} className="spin" /><span>3Dプレビューを準備中</span></div> });
const DETAIL_LEVELS = ["low", "balanced", "high"] as const;
const DETAIL_LABELS = ["シンプル", "バランス", "高精細"];
type Page = "studio" | "library" | "templates";
interface Toast { message: string; kind: "success" | "error"; textureModel?: VoxelModel }

function CubeLogo({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 36 40" fill="none" className={`cube-logo ${className}`} aria-hidden="true">
    <path d="M18 2 34 11.2 18 20.5 2 11.2 18 2Z" fill="#c4a4ff" />
    <path d="m2 11.2 16 9.3V39L2 29.7V11.2Z" fill="#9869e9" />
    <path d="m34 11.2-16 9.3V39l16-9.3V11.2Z" fill="#7850c5" />
    <path d="m18 2 16 9.2L18 20.5 2 11.2 18 2Z" stroke="#e1ceff" strokeWidth="1.2" />
    <path d="M18 20.5V39M2 11.2v18.5L18 39l16-9.3V11.2" stroke="#bc95f5" strokeWidth="1.2" />
    <path d="m10 6.6 16 9.3M10 15.8 26 6.6M10 15.8v18.5m16-18.5v18.5M2 20.5l16 9.3 16-9.3" stroke="#d6b7ff" strokeOpacity=".4" />
  </svg>;
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const titleId = useId();
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex="0"]');
      if (!focusable?.length) { event.preventDefault(); return; }
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={panel} className={`modal ${wide ? "modal-wide" : ""}`} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-header"><h2 id={titleId}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="閉じる"><X size={18} /></button></header>
      {children}
    </section>
  </div>;
}

function TemplateCard({ template, onSelect, detailed = false }: { template: ModelTemplate; onSelect: (template: ModelTemplate) => void; detailed?: boolean }) {
  const model = useMemo(() => generateModel(template.tags, { ...DEFAULT_SETTINGS, palette: template.palette }), [template]);
  return <button className={`template-card ${detailed ? "template-card-large" : ""}`} onClick={() => onSelect(template)}>
    <div className="template-art" style={{ "--template-accent": template.accent } as CSSProperties}>
      <div className="template-art-grid" /><ModelThumbnail model={model} />
      <span className="template-use"><Plus size={13} /> このテンプレートを使う</span>
    </div>
    <div className="template-card-body"><div className="template-name">{template.name}<ArrowUpRight size={14} /></div>
      {detailed ? <p>{template.description}</p> : <span className="template-tags">{template.tags.slice(1, 3).join(" / ")}</span>}
      {detailed && <div className="template-full-tags">{template.tags.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}</div>}
    </div>
  </button>;
}

const inputsKey = (tagList: string[], currentSettings: GenerationSettings, currentTexture: ImportedTexture | null) =>
  stable({ tags: tagList, settings: currentSettings, texture: currentTexture ? { kind: currentTexture.kind, id: hashString(currentTexture.source), cols: currentTexture.cols, rows: currentTexture.rows, slots: currentTexture.slots, extrusion: currentTexture.extrusion ? extrusionKey(currentTexture.extrusion) : null, baseItem: currentTexture.baseItem } : null });
const savedTextureOf = (saved: SavedModel): ImportedTexture | null => {
  const stored = saved.model.texture;
  if (!stored || stored.kind === "generated") return null;
  return { ...stored, source: stored.source, kind: stored.kind as "atlas" | "sprite", width: stored.width, height: stored.height, palette: stored.palette ?? saved.model.palette, name: stored.name ?? saved.name, baseItem: saved.model.baseItem };
};

function ChipRow<T extends string>({ label, options, value, onChange }: { label: string; options: readonly (readonly [T, string])[]; value: T; onChange: (value: T) => void }) {
  return <div className="chip-row"><span className="chip-row-label">{label}</span>
    <div className="config-grid" role="radiogroup" aria-label={label}>{options.map(([id, text]) => <button key={id} type="button" role="radio" aria-checked={value === id} className={value === id ? "config-option selected" : "config-option"} onClick={() => onChange(id)}>{text}</button>)}</div>
  </div>;
}

function JsonCode({ code }: { code: string }) {
  return <div className="json-code">{code.split("\n").map((line, index) => <div className="code-line" key={index}>
    <span className="line-number">{index + 1}</span><code>{line.split(/("(?:[^"\\]|\\.)*"|\b\d+(?:\.\d+)?\b|true|false)/g).map((part, i, parts) => <span key={i} className={part.startsWith('"') ? parts[i + 1]?.trim().startsWith(":") ? "json-key" : "json-string" : /^\d|true|false/.test(part) ? "json-number" : ""}>{part}</span>)}</code>
  </div>)}</div>;
}

export default function Studio() {
  const [page, setPage] = useState<Page>("studio");
  const history = useHistory<StudioConfig>({ ...DEFAULT_CONFIG, extras: normalizeExtras(DEFAULT_EXTRAS) });
  const config = history.value;
  const setConfig = history.set;
  const [editorTab, setEditorTab] = useState<"base" | "decor" | "motion">("base");
  const [selectedDecorId, setSelectedDecorId] = useState<string | null>(null);
  const [settings, setSettings] = useState<GenerationSettings>({ ...DEFAULT_SETTINGS });
  const [model, setModel] = useState<VoxelModel>(() => buildDraft(configToTags(DEFAULT_CONFIG), { ...DEFAULT_SETTINGS, palette: DEFAULT_CONFIG.palette, design: designOf(DEFAULT_CONFIG) }));
  const [modelInputs, setModelInputs] = useState(inputsKey(configToTags(DEFAULT_CONFIG), { ...DEFAULT_SETTINGS, palette: DEFAULT_CONFIG.palette, design: designOf(DEFAULT_CONFIG) }, null));
  const [renderedKey, setRenderedKey] = useState(inputsKey(configToTags(DEFAULT_CONFIG), { ...DEFAULT_SETTINGS, palette: DEFAULT_CONFIG.palette, design: designOf(DEFAULT_CONFIG) }, null));
  const [texture, setTexture] = useState<ImportedTexture | null>(null);
  const [validImagePreview, setValidImagePreview] = useState(true);
  const [modelSource, setModelSource] = useState<"sample" | "generated" | "template" | "saved" | "draft">("sample");
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [tab, setTab] = useState<"model" | "json">("model");
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [cameraView, setCameraView] = useState<CameraView>("perspective");
  const [expanded, setExpanded] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("minecraft");
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("Personal workspace");
  const [workspaceDraft, setWorkspaceDraft] = useState("Personal workspace");
  const [query, setQuery] = useState("");
  const [drawStage, setDrawStage] = useState(-1);
  const [category, setCategory] = useState<"all" | Category>("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [deletingModel, setDeletingModel] = useState<SavedModel | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [transformSignal, setTransformSignal] = useState(0);
  const [transformLoop, setTransformLoop] = useState(false);
  const viewerApi = useRef<ViewerApi | null>(null);
  const generationLock = useRef(false);
  const onViewerReady = useCallback((api: ViewerApi) => { viewerApi.current = api; }, []);
  const notify = useCallback((message: string, kind: "success" | "error" = "success", textureModel?: VoxelModel) => setToast({ message, kind, textureModel }), []);
  // Decorations and animation come only from the on-screen config; a loaded model's saved extras must never linger.
  const effectiveSettings = useMemo<GenerationSettings>(() => {
    const { extras: savedExtras, ...rest } = settings;
    void savedExtras;
    return { ...rest, palette: config.palette, design: designOf(config), ...(config.gradient?.enabled ? { gradient: config.gradient } : {}), ...(hasExtras(config.extras) ? { extras: normalizeExtras(config.extras) } : {}) };
  }, [settings, config]);
  const effectiveTags = useMemo(() => configToTags(config), [config]);
  const analysis = model.analysis;
  const effectiveKey = inputsKey(effectiveTags, effectiveSettings, texture);
  const dirty = effectiveKey !== modelInputs;
  const canGenerate = validImagePreview;
  useEffect(() => {
    if (effectiveKey === renderedKey || busy || texture?.kind === "sprite") return;
    const timeout = setTimeout(() => {
      try {
        setModel(buildDraft(effectiveTags, effectiveSettings, 0, texture?.kind === "atlas" ? toModelTexture(texture) : null));
        setRenderedKey(effectiveKey); setModelSource(dirty ? "draft" : "generated"); if (dirty) setActiveId(null);
      } catch { /* The diagnostic panel explains unsupported input; keep the last valid model. */ }
    }, 180);
    return () => clearTimeout(timeout);
  }, [effectiveKey, renderedKey, dirty, busy, effectiveTags, effectiveSettings, texture]);
  const [giveType, setGiveType] = useState<"simple" | "fancy">("simple");
  const viewModel = useMemo(() => modelAtStage(model, drawStage), [model, drawStage]);
  const json = useMemo(() => JSON.stringify(toMinecraftJson(model, drawStage), null, 2), [model, drawStage]);
  const command = useMemo(() => giveType === "fancy" ? fancyGiveCommand(model) : giveCommand(model), [model, giveType]);
  useEffect(() => { setDrawStage(-1); }, [model]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true); setHistoryError("");
    try {
      const response = await fetch("/api/models", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSavedModels(data.models);
    } catch (err) { setHistoryError(err instanceof Error ? err.message : "履歴を読み込めませんでした。"); }
    finally { setHistoryLoading(false); }
  }, []);
  useEffect(() => { void fetchHistory(); }, [fetchHistory]);
  useEffect(() => {
    try { const stored = localStorage.getItem("voxelforge-workspace"); if (stored) { setWorkspaceName(stored); setWorkspaceDraft(stored); } } catch { /* Storage may be unavailable in private mode. */ }
  }, []);
  useEffect(() => { if (!toast) return; const timeout = setTimeout(() => setToast(null), toast.textureModel ? 12000 : 5000); return () => clearTimeout(timeout); }, [toast]);
  useEffect(() => { if (!expanded) return; const listener = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); }; document.addEventListener("keydown", listener); return () => document.removeEventListener("keydown", listener); }, [expanded]);

  const navigate = (destination: Page) => { setPage(destination); setQuery(""); setMobileMenu(false); setPaletteOpen(false); };
  const patchExtras = (patch: Partial<Extras>) => setConfig(current => ({ ...current, extras: { ...current.extras, ...patch } }));
  const patchAnimation = (patch: Partial<Extras["animation"]>) => {
    setConfig(current => ({ ...current, extras: { ...current.extras, animation: { ...current.extras.animation, ...patch } } }));
    if (patch.transform && patch.transform !== "none") { setPlaying(true); setTransformSignal(value => value + 1); }
  };
  const selectDecor = useCallback((id: string | null) => { setSelectedDecorId(id); if (id) setEditorTab("decor"); }, []);
  const replayTransform = () => { setPlaying(true); setTransformSignal(value => value + 1); };
  const resetConfig = () => { setConfig({ ...DEFAULT_CONFIG, extras: normalizeExtras(DEFAULT_EXTRAS) }); setTexture(null); setSelectedDecorId(null); setValidImagePreview(true); setError(""); };
  const screenshot = () => {
    const source = viewerApi.current?.snapshot?.();
    if (!source) { notify("画像を保存できませんでした。3Dプレビューの読み込み後にお試しください。", "error"); return; }
    const link = document.createElement("a"); link.href = source; link.download = `${model.slug}_preview.png`; link.click();
    notify("プレビュー画像を保存しました。");
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (busy || helpOpen || settingsOpen || deletingModel || !(event.metaKey || event.ctrlKey)) return;
      const target = event.target as HTMLElement;
      if (target.isContentEditable || target.closest('input:not([type="range"]),textarea')) return;
      if (event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? history.redo() : history.undo(); }
      if (event.key.toLowerCase() === "y") { event.preventDefault(); history.redo(); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [history.undo, history.redo, busy, helpOpen, settingsOpen, deletingModel]);
  const generate = useCallback(async (options?: { texture?: ImportedTexture | null; sprite?: { texture: ImportedTexture; model: VoxelModel } }) => {
    if (generationLock.current) return false;
    if (!validImagePreview) { setError("表示できる画像のピクセルがありません。画像か透明のしきい値を確認してください。"); return false; }
    const activeTexture = options?.sprite?.texture ?? (options?.texture !== undefined ? options.texture : texture);
    const finalTags = effectiveTags;
    if (activeTexture?.kind === "sprite" && !finalTags.length) finalTags.push(activeTexture.name || "画像モデル");
    if (finalTags.length > 24 || finalTags.some(tag => tag.length > 64)) { setError("選択内容が大きすぎます。設定を見直してください。"); return false; }
    generationLock.current = true;
    setBusy(true); setError(""); setPaletteOpen(false);
    try {
      let spriteModel = options?.sprite?.model;
      if (activeTexture?.kind === "sprite" && !spriteModel) {
        const imported = await importImageDataUrl(activeTexture.source);
        const extrusion = { ...DEFAULT_VOXELIZE, ...activeTexture.extrusion };
        const result = voxelizeFromImageData(imported.image, extrusion);
        spriteModel = modelFromSprite({ name: activeTexture.name + " モデル", slugSeed: activeTexture.source + extrusionKey(extrusion), cubes: result.cubes, palette: result.palette, tags: finalTags, texture: toModelTexture(activeTexture), baseItem: activeTexture.baseItem ?? model.baseItem ?? "paper" });
      }
      const payload = spriteModel
        ? { mode: "sprite", tags: finalTags, settings: effectiveSettings, model: spriteModel }
        : { tags: finalTags, settings: effectiveSettings, ...(activeTexture?.kind === "atlas" ? { texture: toModelTexture(activeTexture) } : {}) };
      const response = await fetch("/api/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "モデルを保存できませんでした。");
      const saved: SavedModel = data.model;
      const nextTexture = savedTextureOf(saved);
      setModel(saved.model); setActiveId(saved.id); setModelSource("generated"); setTexture(nextTexture);
      setModelInputs(inputsKey(finalTags, effectiveSettings, nextTexture)); setRenderedKey(inputsKey(finalTags, effectiveSettings, nextTexture));
      setSavedModels(previous => [saved, ...previous.filter(item => item.id !== saved.id)]);
      setHistoryError(""); setTab("model"); setWireframe(false);
      setExportFormat(effectiveSettings.format === "blockbench" ? "blockbench" : "bundle");
      notify(spriteModel ? "画像の輪郭を押し出して保存しました。" : activeTexture?.kind === "atlas" ? "UV割り当て付きモデルを保存しました。" : "選択した形でモデルを保存しました。");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "保存に失敗しました。";
      setError(message); notify(message, "error"); return false;
    } finally { generationLock.current = false; setBusy(false); }
  }, [effectiveTags, effectiveSettings, texture, model.baseItem, validImagePreview, notify]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (page === "studio" && (event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); void generate(); } };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [generate, page]);

  const applyTemplate = (template: ModelTemplate) => {
    const b = analyzePrompt(template.tags, { ...DEFAULT_SETTINGS, palette: "auto" }).blueprint;
    const next: StudioConfig = { ...DEFAULT_CONFIG, kind: template.id, material: b.material, motif: profilesFor(template.id).includes(b.profile) ? b.profile : "standard", length: b.length, width: b.width, thickness: b.thickness, scale: b.scale, glow: b.glow ?? false, spikes: b.spikes, palette: template.palette, extras: normalizeExtras(DEFAULT_EXTRAS) };
    setConfig(next); setTexture(null); setValidImagePreview(true); setError(""); setActiveId(null); setSelectedDecorId(null); setTab("model"); setPage("studio"); setEditorTab("base"); setWireframe(false); setCameraView("perspective"); setMobileMenu(false);
    notify(`「${template.name}」のベース形状を読み込みました。装飾は「装飾」タブから追加できます。`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openSaved = (saved: SavedModel) => {
    const next = configFromSaved(saved), restoredTexture = savedTextureOf(saved);
    const { extras: oldExtras, ...rest } = saved.settings; void oldExtras;
    const normalizedSettings = { ...rest, palette: next.palette, design: designOf(next), ...(hasExtras(next.extras) ? { extras: normalizeExtras(next.extras) } : {}) };
    const key = inputsKey(configToTags(next), normalizedSettings, restoredTexture);
    history.replace(next); setSettings(normalizedSettings); setModel(saved.model); setActiveId(saved.id); setModelSource("saved"); setTexture(restoredTexture); setValidImagePreview(true);
    setModelInputs(key); setRenderedKey(key); setError(""); setSelectedDecorId(null);
    setPage("studio"); setTab("model"); setWireframe(false); setMobileMenu(false); setCameraView("perspective");
    setExportFormat(saved.settings.format === "blockbench" ? "blockbench" : "bundle"); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const applyAtlasTexture = (next: ImportedTexture) => generate({ texture: next });
  const applySpriteModel = (next: ImportedTexture, spriteModel: VoxelModel) => generate({ sprite: { texture: next, model: spriteModel } });
  const previewSprite = useCallback((next: ImportedTexture, spriteModel: VoxelModel) => {
    setTexture(next); setModel(spriteModel); setModelSource("draft"); setActiveId(null); setTab("model"); setWireframe(false);
  }, []);
  const clearTexture = () => { setTexture(null); setValidImagePreview(true); notify("テクスチャを解除しました。「モデルを生成」で標準のテクスチャに戻ります。"); };
  const doExport = () => {
    if (!canGenerate) { notify("入力の設定を確認してください。古いプレビューは書き出しません。", "error"); return; }
    try {
      const current = dirty && texture?.kind !== "sprite" ? buildDraft(effectiveTags, effectiveSettings, 0, texture?.kind === "atlas" ? toModelTexture(texture) : null) : model;
      exportModel(current, exportFormat);
      if (exportFormat === "minecraft") notify("JSONを書き出しました。MinecraftではテクスチャPNGも必要です。", "success", model);
      else notify(exportFormat === "blockbench_anim" ? "アニメーション付きのBlockbenchモデルを書き出しました。Generic Modelとして開き、Animateタブで確認できます。" : exportFormat === "datapack" ? "パーティクル用データパックを書き出しました。world/datapacks に入れてください。" : exportFormat === "blockbench" ? "Blockbench用モデルを書き出しました。テクスチャも同梱されています。" : "リソースパックを書き出しました。有効にして、/give コマンドで手に入れましょう。");
    } catch (err) { notify(err instanceof Error ? err.message : "書き出しに失敗しました。", "error"); }
  };
  const copyCommand = async () => { try { await navigator.clipboard.writeText(command); notify("giveコマンドをコピーしました。ゲーム内のチャットに貼り付けてください。"); } catch { notify("コピーできませんでした。コマンドを選択してコピーしてください。", "error"); } };
  const copyJson = async () => { try { await navigator.clipboard.writeText(json); notify("JSONをクリップボードにコピーしました。"); } catch { notify("コピーできませんでした。JSONファイルのダウンロードをご利用ください。", "error"); } };
  const deleteModel = async () => {
    if (!deletingModel || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/models/${deletingModel.id}`, { method: "DELETE" });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error); }
      setSavedModels(current => current.filter(item => item.id !== deletingModel.id));
      if (activeId === deletingModel.id) { setActiveId(null); setModelSource("template"); }
      setDeletingModel(null); notify("モデルをライブラリから削除しました。");
    } catch (err) { notify(err instanceof Error ? err.message : "削除できませんでした。", "error"); }
    finally { setDeleting(false); }
  };
  const filteredModels = useMemo(() => {
    const items = savedModels.filter(item => (kindFilter === "all" || item.model.kind === kindFilter) && `${item.name} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
    return sortOrder === "oldest" ? [...items].reverse() : items;
  }, [savedModels, query, kindFilter, sortOrder]);
  const filteredTemplates = TEMPLATES.filter(item => (category === "all" || item.category === category) && `${item.name} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const closeDelete = useCallback(() => { if (!deleting) setDeletingModel(null); }, [deleting]);

  return <div className="app-shell">
    {mobileMenu && <div className="sidebar-backdrop" onClick={() => setMobileMenu(false)} />}
    <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
      <button className="brand" onClick={() => navigate("studio")} aria-label="VoxelForge ホーム"><CubeLogo /><span>VoxelForge<span className="brand-dot">.</span></span><span className="beta-badge">BETA</span></button>
      <div className="sidebar-main">
        <div className="nav-section-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="メインナビゲーション">
          <button className={page === "studio" ? "nav-item active" : "nav-item"} onClick={() => navigate("studio")}><Sparkles size={17} /><span>モデルを生成</span><span className="nav-active-dot" /></button>
          <button className={page === "library" ? "nav-item active" : "nav-item"} onClick={() => navigate("library")}><Layers3 size={17} /><span>マイライブラリ</span><span className="nav-count">{savedModels.length}</span></button>
          <button className={page === "templates" ? "nav-item active" : "nav-item"} onClick={() => navigate("templates")}><LayoutGrid size={17} /><span>テンプレート</span></button>
        </nav>
        <div className="sidebar-divider" />
        <div className="nav-section-label recent-label">最近のモデル<span>{savedModels.length ? savedModels.length : ""}</span></div>
        <div className="recent-models">
          {savedModels.slice(0, 3).map(saved => <button key={saved.id} className={`recent-item ${activeId === saved.id ? "recent-item-selected" : ""}`} onClick={() => openSaved(saved)}><Box size={15} style={{ color: saved.model.palette[0] }} /><span>{saved.name}</span></button>)}
          {!savedModels.length && <button className="recent-item sample-item" onClick={() => { setPage("studio"); setModel(INITIAL_MODEL); setConfig({ ...DEFAULT_CONFIG }); setSettings({ ...DEFAULT_SETTINGS }); setRenderedKey(""); setModelSource("sample"); setTexture(null); setMobileMenu(false); }}><Box size={15} /><span>{INITIAL_MODEL.name}</span><small>サンプル</small></button>}
        </div>
        <button className="new-model-link" onClick={() => navigate("studio")}><Plus size={13} /> 新しいアイデアをつくる</button>
      </div>
      <div className="sidebar-bottom">
        <div className="sidebar-tip"><div className="tip-illustration"><CubeLogo /><span className="tip-sparkle">✦</span><span className="tip-small-cube"><CubeLogo /></span></div><span className="tip-overline">MAKE SOMETHING YOURS</span><h3>細部まで、あなたらしく。</h3><p>ひらめきを、あなたの世界に。<br />モデルづくりをもっと自由に。</p><button onClick={() => setHelpOpen(true)}>使い方を見る<ArrowUpRight size={13} /></button></div>
        <button className="profile" onClick={() => { setWorkspaceDraft(workspaceName); setSettingsOpen(true); }}><span className="avatar">K</span><span className="profile-text"><strong>クリエイター</strong><small>{workspaceName}</small></span><Settings2 size={15} /></button>
      </div>
    </aside>

    <div className="main-shell">
      <header className="topbar">
        <div className="breadcrumb"><button className="icon-button mobile-toggle" onClick={() => setMobileMenu(true)} aria-label="メニューを開く"><Menu size={20} /></button><FolderClosed size={15} /><span>ワークスペース</span><ChevronRight size={12} /><strong>{page === "studio" ? "モデルジェネレーター" : page === "library" ? "マイライブラリ" : "テンプレート"}</strong></div>
        <div className="topbar-actions"><span className="local-status"><span /> プロシージャル生成</span><div className="topbar-separator" /><button className="documentation-button" onClick={() => setHelpOpen(true)}><BookOpen size={14} /><span>ドキュメント</span><ArrowUpRight size={12} /></button><button className="icon-button help-icon" onClick={() => setHelpOpen(true)} aria-label="ヘルプ"><CircleHelp size={17} /></button><button className="top-avatar" aria-label="ワークスペース設定" onClick={() => { setWorkspaceDraft(workspaceName); setSettingsOpen(true); }}>K</button></div>
      </header>

      <main className="main-content">
        {page === "studio" && <>
          <div className="page-heading"><div><div className="eyebrow"><span /> CRAFTED BY YOU</div><h1>つくる。飾る。自分のものに<span className="title-period">。</span></h1><p>形を選んで、ディテールを重ねて。あなたの世界のための、ボクセル工房。</p></div><div className="studio-history"><button type="button" onClick={history.undo} disabled={!history.canUndo || busy} aria-label="元に戻す" title="元に戻す (Ctrl / ⌘ Z)"><Undo2 size={16} /></button><button type="button" onClick={history.redo} disabled={!history.canRedo || busy} aria-label="やり直す" title="やり直す (Ctrl / ⌘ Shift Z)"><Redo2 size={16} /></button><span /><small>{dirty || modelSource === "draft" ? "編集中" : activeId ? "保存済み" : "新しいモデル"}</small></div></div>
          <div className="workspace-grid">
            <form className="prompt-panel panel" data-editor-tab={editorTab} onPointerDownCapture={event => { if ((event.target as HTMLInputElement).type === "range") history.begin(); }} onKeyDownCapture={event => { if ((event.target as HTMLInputElement).type === "range" && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) history.begin(); }} onSubmit={event => { event.preventDefault(); void generate(); }}>
              <header className="panel-heading"><span className="panel-title"><Sparkles size={16} />モデル設定</span><button type="button" className="icon-button subtle" disabled={busy} onClick={resetConfig} aria-label="初期設定に戻す" title="初期設定に戻す"><RotateCw size={14} /></button></header>
              <div className="editor-tabs" role="tablist" aria-label="編集ステップ">{([['base','形状',Box],['decor','装飾',Sparkles],['motion','モーション',Play]] as const).map(([id,label,Icon]) => <button type="button" role="tab" key={id} aria-label={label} aria-selected={editorTab === id} onClick={() => setEditorTab(id)}><Icon size={14} />{label}{id === "decor" && config.extras.decor.length > 0 && <span>{config.extras.decor.length}</span>}</button>)}</div>
              <fieldset disabled={busy} className="prompt-fields">
                <div className="config-section t-kind">
                  <div className="config-section-head"><span>タイプ</span><em>{optionLabel(KIND_OPTIONS, config.kind)}</em></div>
                  <div className="config-grid kind-grid" role="radiogroup" aria-label="モデルのタイプ">{KIND_OPTIONS.map(option => <button key={option.id} type="button" role="radio" aria-checked={config.kind === option.id} className={config.kind === option.id ? "config-option selected" : "config-option"} title={option.hint} onClick={() => setConfig(current => ({ ...current, kind: option.id, motif: "standard" }))}>{option.label}</button>)}</div>
                </div>
                {(profilesFor(config.kind).length > 1) && <div className="config-section t-motif">
                  <div className="config-section-head"><span>刃の形</span><em>{PROFILE_LABELS[config.motif]}</em></div>
                  <div className="config-grid" role="radiogroup" aria-label="刃の形">{profilesFor(config.kind).map(id => ({ id, label: PROFILE_LABELS[id], hint: PROFILE_LABELS[id] })).map(option => <button key={option.id} type="button" role="radio" aria-checked={config.motif === option.id} className={config.motif === option.id ? "config-option selected" : "config-option"} title={option.hint} onClick={() => setConfig(current => ({ ...current, motif: option.id }))}>{option.label}</button>)}</div>
                </div>}
                <div className="config-section t-material">
                  <div className="config-section-head"><span>素材</span><em>{optionLabel(MATERIAL_OPTIONS, config.material)}</em></div>
                  <div className="config-grid" role="radiogroup" aria-label="素材">{MATERIAL_OPTIONS.map(option => <button key={option.id} type="button" role="radio" aria-checked={config.material === option.id} className={config.material === option.id ? "config-option selected" : "config-option"} onClick={() => setConfig(current => ({ ...current, material: option.id }))}>{option.label}</button>)}</div>
                </div>
                <div className="config-section t-palette">
                  <div className="config-section-head"><span>配色</span><em>{config.palette === "auto" ? "自動" : PALETTE_LABELS[config.palette]}</em></div>
                  <div className="palette-grid" role="radiogroup" aria-label="配色">
                    <button type="button" role="radio" aria-checked={config.palette === "auto"} aria-label="素材に合わせる" title="素材に合わせる" className={config.palette === "auto" ? "palette-option selected" : "palette-option"} onClick={() => setConfig(current => ({ ...current, palette: "auto" }))}><span className="palette-auto">A</span></button>
                    {(Object.keys(PALETTE_LABELS) as ConcretePalette[]).map(palette => <button key={palette} type="button" role="radio" aria-checked={config.palette === palette} title={PALETTE_LABELS[palette]} aria-label={PALETTE_LABELS[palette]} className={config.palette === palette ? "palette-option selected" : "palette-option"} onClick={() => setConfig(current => ({ ...current, palette }))}>{PALETTES[palette].slice(0, 3).map(color => <span key={color} style={{ background: color }} />)}</button>)}
                  </div>
                  <p className="config-note">「自動」では素材から配色を決めます。手動で選ぶとその配色が優先されます。</p>
                </div>
                <div className="config-section t-gradient">
                  <div className="config-section-head"><span>グラデーション</span><em>{config.gradient?.enabled ? "有効" : "無効"}</em></div>
                  <label className={config.gradient?.enabled ? "toggle-chip selected" : "toggle-chip"}><input type="checkbox" aria-label="グラデーションを適用" checked={config.gradient?.enabled ?? false} onChange={event => setConfig(current => ({ ...current, gradient: { ...(current.gradient ?? { enabled: false, direction: "vertical" as const, intensity: .5, colors: ["#c29af5", "#6744a2"] as [string, string] }), enabled: event.target.checked } }))} /><span>グラデーションを適用</span></label>
                  {config.gradient?.enabled && <>
                    <div className="chip-row"><span className="chip-row-label">方向</span><div className="config-grid" role="radiogroup" aria-label="グラデーション方向">{(["vertical","horizontal","radial"] as const).map(dir => <button key={dir} type="button" role="radio" aria-checked={config.gradient!.direction === dir} className={config.gradient!.direction === dir ? "config-option selected" : "config-option"} onClick={() => setConfig(current => ({ ...current, gradient: { ...current.gradient!, direction: dir } }))}>{dir === "vertical" ? "縦" : dir === "horizontal" ? "横" : "放射"}</button>)}</div></div>
                    <div className="dimension-field"><div className="field-label"><span>強さ</span><span className="detail-value">{Math.round((config.gradient!.intensity) * 100)}%</span></div><input type="range" aria-label="グラデーション強さ" min="0" max="1" step="0.05" value={config.gradient!.intensity} style={{ "--range-progress": `${config.gradient!.intensity * 100}%` } as CSSProperties} onChange={event => setConfig(current => ({ ...current, gradient: { ...current.gradient!, intensity: Number(event.target.value) } }))} /></div>
                    <div className="axis-inputs"><label data-axis="Y"><span>開始</span><input type="color" value={config.gradient!.colors[0]} onChange={event => setConfig(current => ({ ...current, gradient: { ...current.gradient!, colors: [event.target.value, current.gradient!.colors[1]] } }))} /></label><label data-axis="Z"><span>終了</span><input type="color" value={config.gradient!.colors[1]} onChange={event => setConfig(current => ({ ...current, gradient: { ...current.gradient!, colors: [current.gradient!.colors[0], event.target.value] } }))} /></label></div>
                  </>}
                  <p className="config-note">パレットの色をグラデーションでブレンドします。</p>
                </div>
                <div className="config-section t-dimensions">
                  <div className="config-section-head"><span>寸法</span></div>
                  {([
                    ["length", "長さ", .5, 1.6],
                    ["width", "幅", .5, 1.6],
                    ["thickness", "厚み", .5, 1.6],
                    ["scale", "大きさ", .5, 1.5],
                  ] as const).map(([key, label, min, max]) => <div className="dimension-field" key={key}>
                    <div className="field-label"><span>{label}</span><span className="detail-value">{Math.round(config[key] * 100)}%</span></div>
                    <input type="range" aria-label={label} min={min} max={max} step=".05" value={config[key]} style={{ "--range-progress": `${((config[key] - min) / (max - min)) * 100}%` } as CSSProperties} onChange={event => setConfig(current => ({ ...current, [key]: Number(event.target.value) }))} />
                  </div>)}
                </div>
                <div className="config-section t-processing">
                  <div className="config-section-head"><span>加工</span></div>
                  <div className="config-toggles">
                    <label className={config.glow ? "toggle-chip selected" : "toggle-chip"}><input type="checkbox" checked={config.glow} onChange={event => setConfig(current => ({ ...current, glow: event.target.checked }))} /><span>発光させる</span></label>
                    <label className={config.spikes ? "toggle-chip selected" : "toggle-chip"}><input type="checkbox" checked={config.spikes} onChange={event => setConfig(current => ({ ...current, spikes: event.target.checked }))} /><span>トゲを付ける</span></label>
                  </div>
                </div>
                <div className="config-section t-decor">{texture?.kind === "sprite" ? <div className="image-mode-boundary"><ImageIcon size={19} /><h3>画像の押し出しモード</h3><p>装飾は型から作ったモデルで編集できます。下の画像パネルで厚みや輪郭を調整してください。</p><button type="button" className="secondary-button" onClick={clearTexture}>型からの制作に戻る</button></div> : <DecorEditor extras={config.extras} onChange={patch => { setConfig(current => ({ ...current, style: "plain", extras: { ...current.extras, ...patch } })); }} selectedId={selectedDecorId} onSelect={selectDecor} disabled={busy} />}</div>
                <div className="config-section t-accent">
                  <div className="config-section-head"><span>差し色</span><em>{{auto:"自動",gold:"金",rose:"ローズ",cyan:"シアン",emerald:"エメラルド",lavender:"ラベンダー",white:"白"}[config.extras.accent]}</em></div>
                  <div className="accent-chips" role="radiogroup" aria-label="差し色">{(["auto","gold","rose","cyan","emerald","lavender","white"] as const).map(id => <button key={id} type="button" role="radio" aria-checked={config.extras.accent === id} className={config.extras.accent === id ? "accent-chip selected" : "accent-chip"} onClick={() => patchExtras({ accent: id })} aria-label={{auto:"自動",gold:"金",rose:"ローズ",cyan:"シアン",emerald:"エメラルド",lavender:"ラベンダー",white:"白"}[id]}>
                    <span className="accent-swatch" style={{ background: id === "auto" ? "linear-gradient(135deg,#5a3c78,#9a7cb8)" : {gold:"#f2cf7a",rose:"#f29bb8",cyan:"#66e0ea",emerald:"#5bdc9a",lavender:"#b99bff",white:"#eef1f8"}[id] }} />
                    <span className="accent-label">{{auto:"自動",gold:"金",rose:"ローズ",cyan:"シアン",emerald:"エメラルド",lavender:"ラベンダー",white:"白"}[id]}</span>
                  </button>)}</div>
                  <p className="config-note">装飾と金具の色を変更します。パーツを選ぶと個別の色も指定できます。</p>
                </div>
                <div className="config-section t-effect">
                  <div className="config-section-head"><span>エフェクト（パーティクル）</span><em>{EFFECT_OPTIONS.find(option => option.id === config.extras.effect)?.label}</em></div>
                  <div className="config-grid" role="radiogroup" aria-label="エフェクト">{EFFECT_OPTIONS.map(option => <button key={option.id} type="button" role="radio" aria-checked={config.extras.effect === option.id} title={option.hint} className={config.extras.effect === option.id ? "config-option selected" : "config-option"} onClick={() => patchExtras({ effect: option.id as EffectId })}>{option.label}</button>)}</div>
                  <p className="config-note">プレビューで動きます。ゲームでは「パーティクル用データパック」で実現します。</p>
                </div>
                <div className="config-section t-anim">
                  <div className="config-section-head"><span>アニメーション</span></div>
                  <ChipRow label="本体の動き" options={BODY_ANIMS.map(id => [id, BODY_LABELS[id]] as const)} value={config.extras.animation.body} onChange={body => patchAnimation({ body })} />
                  <ChipRow label="装飾の動き" options={DECOR_ANIMS.map(id => [id, DECOR_LABELS[id]] as const)} value={config.extras.animation.decor} onChange={decor => patchAnimation({ decor })} />
                  <ChipRow label="トランスフォーム" options={TRANSFORM_ANIMS.map(id => [id, TRANSFORM_LABELS[id]] as const)} value={config.extras.animation.transform} onChange={transform => patchAnimation({ transform })} />
                  <div className="dimension-field">
                    <div className="field-label"><span>速度</span><span className="detail-value">{config.extras.animation.speed.toFixed(2)}×</span></div>
                    <input type="range" aria-label="アニメーション速度" min=".5" max="2" step=".25" value={config.extras.animation.speed} style={{ "--range-progress": `${((config.extras.animation.speed - .5) / 1.5) * 100}%` } as CSSProperties} onChange={event => patchAnimation({ speed: Number(event.target.value) })} />
                  </div>
                  <label className={config.extras.animation.shimmer ? "toggle-chip selected" : "toggle-chip"}><input type="checkbox" checked={config.extras.animation.shimmer} onChange={event => patchAnimation({ shimmer: event.target.checked })} /><span>テクスチャをきらめかせる（ゲームでも動作）</span></label>
                  <p className="config-note">ゲーム内で動くのはテクスチャのきらめきのみです。本体・装飾・トランスフォームの動きはプレビューと、Blockbench用の .bbmodel に出力されます。</p>
                </div>

                {texture && <div className="texture-chip"><ImageIcon size={12} /><span>{texture.kind === "atlas" ? "UVアトラス" : "2Dテクスチャ"} · {texture.name}</span><em>{texture.width}×{texture.height}</em><button type="button" onClick={clearTexture} aria-label="テクスチャを解除"><X size={11} /></button></div>}
                <div className="form-divider" />
                <div className="settings-heading"><span>出力設定</span></div>
                <div className="format-field"><label htmlFor="model-format">モデル形式</label><div className="select-wrap"><Box size={13} /><select id="model-format" value={settings.format} onChange={event => { const format = event.target.value as GenerationSettings["format"]; setSettings({ ...settings, format }); setExportFormat(format === "blockbench" ? "blockbench" : "minecraft"); }}><option value="minecraft">Minecraft Java</option><option value="blockbench">Blockbench</option></select><ChevronDown size={12} /></div></div>
                <div className="resolution-field"><div className="field-label">テクスチャ解像度<span>px</span></div><div className="resolution-options" role="group" aria-label="テクスチャ解像度">{([16, 32, 64] as const).map(resolution => <button key={resolution} type="button" aria-pressed={settings.resolution === resolution} className={settings.resolution === resolution ? "selected" : ""} onClick={() => setSettings({ ...settings, resolution })}>{resolution} × {resolution}</button>)}</div></div>
                <div className="detail-field"><div className="field-label"><label htmlFor="detail">ディテール</label><span className="detail-value">{DETAIL_LABELS[DETAIL_LEVELS.indexOf(settings.detail)]}</span></div><input type="range" id="detail" aria-label="モデルのディテール" min="0" max="2" step="1" value={DETAIL_LEVELS.indexOf(settings.detail)} style={{ "--range-progress": `${DETAIL_LEVELS.indexOf(settings.detail) * 50}%` } as CSSProperties} onChange={event => setSettings({ ...settings, detail: DETAIL_LEVELS[Number(event.target.value)] })} /><div className="detail-labels">{DETAIL_LABELS.map((label, index) => <span key={label} className={index === DETAIL_LEVELS.indexOf(settings.detail) ? "selected" : ""}>{label}</span>)}</div></div>
              </fieldset>
              <div className="generate-footer">{error && <div className="form-error" role="alert"><CircleHelp size={13} /><span>{error}</span></div>}<button className="generate-button" type="submit" disabled={busy || !canGenerate}>{busy ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}<span>{busy ? "保存中..." : "モデルを保存"}</span><kbd>⌘ ↵</kbd></button><p><span className="tiny-dot" />変更はプレビューへ反映 · Ctrl / ⌘ + Enter で保存</p></div>
            </form>

            <div className="preview-column">
              {expanded && <div className="preview-backdrop" onClick={() => setExpanded(false)} />}
              <section className={`preview-panel panel ${expanded ? "is-expanded" : ""}`} aria-label="生成モデルのプレビュー">
                <header className="preview-header"><span className="panel-title"><Box size={16} /><span>プレビュー</span></span><div className="preview-tabs" role="tablist" aria-label="プレビュー形式"><button role="tab" aria-selected={tab === "model"} className={tab === "model" ? "selected" : ""} onClick={() => setTab("model")}><Box size={12} />3Dモデル</button><button role="tab" aria-selected={tab === "json"} className={tab === "json" ? "selected" : ""} onClick={() => setTab("json")}><Code2 size={13} />JSON</button></div><div className="preview-header-actions"><button type="button" className="icon-button" aria-label="プレビュー画像を保存" title="PNG画像を保存" onClick={screenshot}><Camera size={15} /></button><button className="icon-button" onClick={() => setExpanded(!expanded)} aria-label={expanded ? "拡大表示を閉じる" : "拡大表示"}>{expanded ? <Minimize size={15} /> : <Expand size={15} />}</button><button className="icon-button" onClick={doExport} disabled={busy || !canGenerate} aria-label="現在の形式でダウンロード"><Download size={15} /></button></div></header>
                {tab === "model" ? <div className={`viewer-stage ${busy ? "is-generating" : ""}`}>
                  <ModelViewer model={viewModel} autoRotate={autoRotate} wireframe={wireframe} showGrid={showGrid} view={cameraView} selectedDecorId={selectedDecorId} onDecorationSelect={selectDecor} onReady={onViewerReady} playing={playing} transformSignal={transformSignal} transformLoop={transformLoop} />
                  <div className="view-select"><select aria-label="カメラビュー" value={cameraView} onChange={event => setCameraView(event.target.value as CameraView)}><option value="perspective">パースペクティブ</option><option value="front">正面</option><option value="top">上面</option><option value="right">右側面</option></select><ChevronDown size={10} /></div>
                  <span className={`model-status ${busy ? "working" : ""}`}>{busy ? <Loader2 size={10} className="spin" /> : <span />}{busy ? "生成中" : modelSource === "generated" ? "生成完了" : modelSource === "saved" ? "保存済み" : modelSource === "template" ? "テンプレート" : modelSource === "draft" ? "未保存のプレビュー" : "プレビュー"}</span>
                  <span className="viewport-corner top-left" /><span className="viewport-corner top-right" /><span className="viewport-corner bottom-left" /><span className="viewport-corner bottom-right" />
                  {busy && <div className="generation-overlay"><div className="scan-line" /><span><Sparkles size={15} />設定を保存しています</span></div>}
                  <div className="model-caption"><h3>{model.name}</h3><span>{!canGenerate ? "画像に表示できるピクセルがありません" : texture?.kind === "sprite" ? "画像の輪郭を押し出したモデル（奥行きの推定ではありません）" : dirty ? "選択の変更を反映中・保存前のプレビュー" : modelSource === "sample" ? "サンプルモデル · 選択を変えて試せます" : "選択内容は左のパネルで確認できます"}</span></div>
                  <div className="viewer-controls"><button className={autoRotate ? "selected" : ""} onClick={() => setAutoRotate(!autoRotate)} aria-label="自動回転" aria-pressed={autoRotate} title="自動回転"><RotateCw size={16} /></button><button className={showGrid ? "selected" : ""} onClick={() => setShowGrid(!showGrid)} aria-label="グリッドを表示" aria-pressed={showGrid} title="グリッド"><Grid3X3 size={16} /></button><button className={wireframe ? "selected" : ""} onClick={() => setWireframe(!wireframe)} aria-label="ワイヤーフレーム" aria-pressed={wireframe} title="ワイヤーフレーム"><Scan size={16} /></button><span className="control-divider" />
                    <button className={playing ? "selected" : ""} onClick={() => setPlaying(value => !value)} aria-label="アニメーションを再生・停止" aria-pressed={playing} title={playing ? "停止" : "再生"}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>
                    {config.extras.animation.transform !== "none" && <><button onClick={replayTransform} aria-label="トランスフォームを再生" title="トランスフォームを再生"><Wand2 size={15} /></button><button className={transformLoop ? "selected" : ""} onClick={() => setTransformLoop(value => !value)} aria-label="トランスフォームを繰り返す" aria-pressed={transformLoop} title="繰り返し"><Repeat size={15} /></button></>}
                    <span className="control-divider" /><button onClick={() => { setCameraView("perspective"); viewerApi.current?.reset(); }} aria-label="ビューをリセット" title="ビューをリセット"><MousePointer2 size={15} /></button></div>
                  {model.variants && <div className="draw-control" role="group" aria-label="弓を引く動作のプレビュー"><span>弓を引く</span>{["待機", "引き始め", "半分", "最大"].map((label, index) => <button key={label} aria-pressed={drawStage === index - 1} className={drawStage === index - 1 ? "selected" : ""} onClick={() => setDrawStage(index - 1)}>{label}</button>)}</div>}
                  <span className="viewer-instructions"><MousePointer2 size={10} />ドラッグで回転<span>·</span>スクロールで拡大</span>
                  <div className="axis-gizmo"><svg viewBox="0 0 72 72" aria-hidden="true"><path d="M35 42V12" stroke="#65ba97" strokeWidth="1.5" /><path d="m35 42 23 13" stroke="#cb717d" strokeWidth="1.5" /><path d="m35 42-23 13" stroke="#8e83dc" strokeWidth="1.5" /><circle cx="35" cy="42" r="3" fill="#b6abc9" /></svg><button className="axis-y" onClick={() => setCameraView("top")} title="上面" aria-label="上面ビュー">Y</button><button className="axis-x" onClick={() => setCameraView("right")} title="右側面" aria-label="右側面ビュー">X</button><button className="axis-z" onClick={() => setCameraView("front")} title="正面" aria-label="正面ビュー">Z</button></div>
                </div> : <div className="json-stage"><div className="json-toolbar"><span><FileJson size={13} />{model.slug}.json</span><button onClick={() => void copyJson()}><Copy size={12} />コピー</button></div><JsonCode code={json} /></div>}
                <footer className="preview-stats"><div className="stats-group"><span><Box size={12} /><strong>{viewModel.cubes.length}</strong> エレメント</span><span><Grid2X2 size={12} /><strong>{textureWidth(model)} × {textureHeight(model)}</strong> px</span><span><Files size={12} /><strong>{getModelSize(viewModel)}</strong> KB</span></div><span className="edition-badge">{settings.format === "minecraft" ? "JAVA EDITION" : "BLOCKBENCH"}</span></footer>
              </section>
              <div className="export-panel panel"><div className="export-message"><span className="export-check"><Check size={16} /></span><div><strong>あなたの世界へ、持ち出そう。</strong><p>モデルをダウンロードして、制作の続きを。</p></div></div><div className="export-actions"><div className="export-select"><select value={exportFormat} aria-label="書き出し形式" onChange={event => setExportFormat(event.target.value as ExportFormat)}><option value="minecraft">Minecraft (.json)</option><option value="blockbench">Blockbench (.bbmodel)</option><option value="bundle">リソースパック (.zip)</option><option value="blockbench_anim">Blockbench + アニメーション (.bbmodel)</option><option value="datapack">パーティクル用データパック (.zip)</option></select><ChevronDown size={12} /></div><button className="download-button" onClick={doExport} disabled={busy || !canGenerate}><Download size={14} />ダウンロード</button></div></div>
              <div className="give-panel panel">
                <div className="give-head">
                  <div className="give-title-group">
                    <span className="give-title"><Terminal size={14} />ゲームで使う (/give コマンド)</span>
                    <span className="give-version">Java 1.21.4 向け</span>
                  </div>
                  <div className="give-mode-switch" role="radiogroup" aria-label="コマンドの種類">
                    <button type="button" role="radio" aria-checked={giveType === "fancy"} className={giveType === "fancy" ? "selected" : ""} onClick={() => setGiveType("fancy")}>名前・不壊付き</button>
                    <button type="button" role="radio" aria-checked={giveType === "simple"} className={giveType === "simple" ? "selected" : ""} onClick={() => setGiveType("simple")}>標準</button>
                  </div>
                </div>
                <div className="give-command">
                  <code>{command}</code>
                  <button onClick={() => void copyCommand()} aria-label="giveコマンドをコピー"><Copy size={13} />コピー</button>
                </div>
                <p className="give-desc">
                  {giveType === "fancy" ? "名前・説明文・不壊を追加します。長いコマンドはコマンドブロックかサーバーコンソールで実行してください。" : "必要最小限の item_model コンポーネントのみを指定した基本コマンドです。"}
                </p>

                <ExportReport model={model} />
              </div>
            </div>
          </div>
          <TextureStudio tags={effectiveTags} texture={texture} busy={busy} generationError={error} onPreview={previewSprite} onValidityChange={setValidImagePreview} onApplyAtlas={applyAtlasTexture} onVoxelize={applySpriteModel} onClear={clearTexture} />
          <section className="starter-templates"><div className="section-heading"><div><h2>まずは、ここから。</h2><p>テンプレートから、アイデアを広げよう。</p></div><button onClick={() => navigate("templates")}>すべてのテンプレート<ArrowRight size={13} /></button></div><div className="template-grid">{TEMPLATES.slice(0, 4).map(template => <TemplateCard key={template.id} template={template} onSelect={applyTemplate} />)}</div></section>
        </>}

        {page === "library" && <>
          <div className="page-heading"><div><div className="eyebrow"><span /> YOUR PERSONAL COLLECTION</div><h1>マイライブラリ<span className="title-period">。</span></h1><p>生まれたアイデアを、いつでもここから。</p></div><button className="secondary-button" onClick={() => navigate("studio")}><Plus size={15} />新しいモデル</button></div>
          <div className="collection-toolbar"><div className="search-box"><Search size={15} /><input aria-label="モデルを検索" value={query} onChange={event => setQuery(event.target.value)} placeholder="モデル名やタグで検索..." />{query && <button aria-label="検索をクリア" onClick={() => setQuery("")}><X size={13} /></button>}</div><div className="collection-filters"><select aria-label="モチーフで絞り込み" value={kindFilter} onChange={event => setKindFilter(event.target.value)}><option value="all">すべてのモデル</option>{TEMPLATES.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select><select aria-label="並び順" value={sortOrder} onChange={event => setSortOrder(event.target.value)}><option value="newest">新しい順</option><option value="oldest">古い順</option></select></div></div>
          <div className="collection-label"><span>{filteredModels.length} モデル</span><button onClick={() => void fetchHistory()}><RotateCw size={12} />更新</button></div>
          {historyLoading ? <div className="empty-state"><Loader2 size={26} className="spin" /><h2>ライブラリを読み込んでいます</h2></div> : historyError ? <div className="empty-state"><CircleHelp size={34} /><h2>履歴を読み込めませんでした</h2><p>{historyError}</p><button className="secondary-button" onClick={() => void fetchHistory()}>もう一度試す</button></div> : !filteredModels.length ? <div className="empty-state"><span className="empty-cube"><CubeLogo /></span><h2>{savedModels.length ? "モデルが見つかりません" : "最初のひらめきを、保存しよう。"}</h2><p>{savedModels.length ? "別のキーワードや絞り込み条件をお試しください。" : "モデルを生成すると、このライブラリに自動で保存されます。"}</p><button className="secondary-button" onClick={() => savedModels.length ? (setQuery(""), setKindFilter("all")) : navigate("studio")}>{savedModels.length ? "検索条件をクリア" : "モデルをつくる"}<ArrowRight size={14} /></button></div> : <div className="library-grid">{filteredModels.map(saved => <article className="library-card panel" key={saved.id}><button className="library-open" onClick={() => openSaved(saved)}><div className="library-art" style={{ "--template-accent": saved.model.palette[0] } as CSSProperties}><ModelThumbnail model={saved.model} /><span className="library-format">{saved.settings.resolution} × {saved.settings.resolution}</span></div><div className="library-card-body"><h3>{saved.name}</h3><p>{saved.tags.slice(0, 3).join("・")}</p></div></button><div className="library-card-footer"><span>{new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(saved.createdAt))}</span><button className="icon-button" aria-label={`「${saved.name}」を削除`} onClick={() => setDeletingModel(saved)}><Trash2 size={13} /></button></div></article>)}</div>}
        </>}

        {page === "templates" && <>
          <div className="page-heading"><div><div className="eyebrow"><span /> A LITTLE INSPIRATION</div><h1>つくる、きっかけ<span className="title-period">。</span></h1><p>気になるモデルを選んで、あなただけのアレンジを。</p></div><span className="compatibility-badge"><LayoutGrid size={13} />{TEMPLATES.length}つのスターターモデル</span></div>
          <div className="templates-banner"><div><span className="tip-overline">YOUR IDEAS. YOUR WORLD.</span><h2>ひとつの形から、<br />新しい物語がはじまる。</h2><p>テンプレートの形・配色・ディテールを変えて、<br />オリジナルのモデルをつくってみよう。</p></div><div className="banner-model"><ModelThumbnail model={generateModel(TEMPLATES[0].tags, { ...DEFAULT_SETTINGS, palette: "violet" })} /></div><span className="banner-sparkle one">✦</span><span className="banner-sparkle two">+</span></div>
          <div className="templates-search"><h2>スターターテンプレート<span>{filteredTemplates.length}</span></h2><div className="search-box"><Search size={15} /><input aria-label="テンプレートを検索" value={query} onChange={event => setQuery(event.target.value)} placeholder="テンプレートを検索..." /></div></div>
          <div className="category-chips" role="group" aria-label="カテゴリ">{(["all", "weapon", "tool", "decor"] as const).map(key => <button key={key} aria-pressed={category === key} className={category === key ? "selected" : ""} onClick={() => setCategory(key)}>{key === "all" ? "すべて" : CATEGORY_LABELS[key]}<span>{key === "all" ? TEMPLATES.length : TEMPLATES.filter(item => item.category === key).length}</span></button>)}</div>
          <div className="template-grid full-template-grid">{filteredTemplates.map(template => <TemplateCard key={template.id} template={template} onSelect={applyTemplate} detailed />)}</div>
          {!filteredTemplates.length && <div className="empty-state"><Search size={28} /><h2>テンプレートが見つかりません</h2><button className="secondary-button" onClick={() => setQuery("")}>検索をクリア</button></div>}
        </>}
        <footer className="page-footer"><span><span className="tiny-dot" />ひらめきから、ものづくりへ。</span><span>VoxelForge <span className="footer-version">v1.0</span></span></footer>
      </main>
    </div>

    {toast && <div className={`toast ${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"}>{toast.kind === "error" ? <CircleHelp size={18} /> : <CheckCircle2 size={18} />}<div><span>{toast.message}</span>{toast.textureModel && <button onClick={() => { try { downloadTexture(toast.textureModel!); notify("テクスチャPNGを書き出しました。"); } catch { notify("テクスチャの書き出しに失敗しました。", "error"); } }}><Download size={12} />テクスチャPNGも保存</button>}</div><button className="toast-close" onClick={() => setToast(null)} aria-label="通知を閉じる"><X size={14} /></button></div>}

    {helpOpen && <Modal title="VoxelForgeの使い方" onClose={closeHelp} wide><div className="help-content"><div className="help-intro"><span className="help-intro-icon"><Sparkles size={23} /></span><div><h3>選んで、あなたの世界へ。</h3><p>3つのステップで、モデルづくりをはじめましょう。</p></div></div><div className="help-steps"><article><span>01</span><h4>タイプ・素材・形を選ぶ</h4><p>タイプ、刃の形、素材、配色を選択。長さ・幅・厚み・大きさはスライダーで調整します。</p></article><article><span>02</span><h4>カタチを生成</h4><p>解像度とディテールを選び「モデルを保存」。結果はライブラリに自動保存されます。</p></article><article><span>03</span><h4>制作の続きを</h4><p>3Dプレビューで確認し、好きな形式でダウンロード。BlockbenchやMinecraftで活用できます。</p></article></div><h4 className="help-section-title">対応モチーフ</h4><div className="help-motif-tags">{["剣 / sword", "ピッケル / pickaxe", "斧 / axe", "シャベル / shovel", "弓 / bow", "杖 / staff", "トライデント / trident", "宝箱 / chest", "キノコ / mushroom", "ランタン / lantern", "結晶 / crystal", "木 / tree", "家 / house", "ロボット / robot"].map(tag => <span key={tag}>{tag}</span>)}</div><p className="help-note">「形状」でモデルの種類・素材・寸法を、「装飾」で各パーツの配置・個数・色を、「モーション」で動きを選びます。同じ装飾は複数配置でき、Ctrl / ⌘ + Z で元に戻せます。画像の押し出しは輪郭に厚みを付ける機能で、見えない奥行きは推定しません。</p><h4 className="help-section-title">書き出し形式</h4><div className="help-formats"><div><FileJson size={18} /><section><strong>Minecraft (.json)</strong><p>Java EditionのモデルJSON。書き出し後の通知からPNGテクスチャも保存してください。モデル参照の設定は別途必要です。</p></section></div><div><Box size={18} /><section><strong>Blockbench (.bbmodel)</strong><p>テクスチャを埋め込んだ編集用プロジェクト。Blockbench 5.0以降でそのまま開けます。</p></section></div><div><Files size={18} /><section><strong>リソースパック (.zip)</strong><p>Java 1.21.4向けのリソースパック。ゲーム内での目視確認は別途必要です。pack.mcmeta・アイテム定義・モデル・テクスチャを同梱し、/give コマンドで入手できます。</p></section></div></div><h4 className="help-section-title">テクスチャの取り込み</h4><div className="help-formats"><div><Grid2X2 size={18} /><section><strong>UVアトラスから生成</strong><p>タイル状の画像を素材に割り当てます。分割数と8つの素材スロットの参照位置を選べます。画像だけから元の3D形状や任意の展開図の意味を推定する機能ではありません。</p></section></div><div><Scan size={18} /><section><strong>2Dテクスチャから立体化</strong><p>元の縦横比と最大64pxまでの輪郭を保って押し出します。写真から背面や奥行きを推定する機能ではありません。白背景を除去する場合は画像パネルの設定を使用してください。</p></section></div></div><div className="help-bottom"><span><Keyboard size={13} /> ⌘ / Ctrl + Enter で生成</span><a href="https://www.blockbench.net/" target="_blank" rel="noreferrer">Blockbenchを開く<ArrowUpRight size={13} /></a></div></div></Modal>}
    {settingsOpen && <Modal title="ワークスペース設定" onClose={closeSettings}><form className="workspace-settings" onSubmit={event => { event.preventDefault(); const name = workspaceDraft.trim() || "Personal workspace"; setWorkspaceName(name); try { localStorage.setItem("voxelforge-workspace", name); } catch { /* Optional preference storage. */ } setSettingsOpen(false); notify("ワークスペース設定を保存しました。"); }}><div className="settings-profile"><span className="avatar large">K</span><div><strong>クリエイター</strong><p>あなたの個人ワークスペース</p></div></div><label htmlFor="workspace-name">ワークスペース名</label><input id="workspace-name" value={workspaceDraft} maxLength={32} onChange={event => setWorkspaceDraft(event.target.value)} /><label className="checkbox-label"><input type="checkbox" checked={showGrid} onChange={event => setShowGrid(event.target.checked)} /><span>3Dプレビューにグリッドを表示</span></label><div className="workspace-data-note"><Layers3 size={16} /><span><strong>ライブラリ {savedModels.length} モデル</strong><br />モデルはこのサーバーのデータベースに保存され、直近40件を表示します。</span></div><button className="generate-button" type="submit"><Check size={15} />設定を保存</button></form></Modal>}
    {deletingModel && <Modal title="モデルを削除" onClose={closeDelete}><div className="delete-content"><div className="delete-preview"><ModelThumbnail model={deletingModel.model} /></div><h3>「{deletingModel.name}」を削除しますか？</h3><p>ライブラリから削除されます。この操作は取り消せません。<br />ダウンロード済みのファイルには影響しません。</p><div className="delete-actions"><button className="secondary-button" disabled={deleting} onClick={closeDelete}>キャンセル</button><button className="danger-button" disabled={deleting} onClick={() => void deleteModel()}>{deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}削除する</button></div></div></Modal>}
  </div>;
}
