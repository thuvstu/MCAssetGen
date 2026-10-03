import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettled } from './hooks/useSettled';
import {
  Hammer, Dices, Download, Search, Brush, Eraser, Pipette, PaintBucket,
  Undo2, Grid3X3, Sparkles, Layers, Package, Eye, Wand2, ChevronRight,
  Cuboid, Swords, Shirt, Gem, Cpu, Info, Zap, Image as ImageIcon, FileArchive,
  RotateCcw, Flame, Droplets, Waves, CircleDot, Clock3, SlidersHorizontal,
  Copy, Save, Upload, Trash2, Shuffle, Snowflake, Leaf, Sun, CloudLightning,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, FlipHorizontal2, FlipVertical2, RotateCw, Scan,
  Feather, Move, Crosshair,
} from 'lucide-react';
import { ITEMS, CATEGORIES, RARITY_COLOR, RARITY_JP, type ItemDef } from './lib/items';
import {
  PRESETS, DEFAULT_TEXTURE_ESSENCE, DEFAULT_SHAPE_OPTIONS, generateTexture, renderToDataURL,
  type AnimationMode, type ElementMode, type RenderMetrics, type StyleOptions, type TextureEssence, type ShapeOptions,
} from './lib/generator';
import { BASE_FORMS, DECORATIONS, type BaseForm, type Decoration } from './lib/forms';
import {
  BASE_ITEM_OPTIONS, DEFAULT_BASE_ITEM, MINECRAFT_TARGETS, buildMinecraftProject,
  type MinecraftTarget,
} from './lib/minecraft';
import {
  ACCENT_MATERIALS, ANIMATION_DEFS, ELEMENTS, HANDLE_MATERIALS, PRESET_MIX,
  PRIMARY_MATERIALS, TWIN_MODES,
} from './lib/catalog';
import { EssenceSlider, ItemThumb, Slider } from './components/controls';
import { DecorationPanel } from './components/DecorationPanel';
import { canonicalTweaks, tweakOf, updateTweak } from './lib/layers';
import { DEFAULT_DECOR_TWEAK } from './lib/design';
import { loadBlueprintStore, normalizeBlueprint, type BlueprintData } from './lib/blueprints';
import JSZip from 'jszip';

type OverrideRole = 'primary' | 'accent' | 'handle';

const CATALOG_ICONS: Record<string, typeof Sparkles> = {
  circle: CircleDot, sparkle: Sparkles, waves: Waves, flame: Flame, wand: Wand2,
  drop: Droplets, feather: Feather, gem: Gem, storm: CloudLightning, frost: Snowflake,
  sun: Sun, leaf: Leaf,
};

export default function App() {
  const [itemId, setItemId] = useState('hyperion');
  const [resolution, setResolution] = useState<16 | 32 | 64>(64);
  const [presetId, setPresetId] = useState('reborn');
  const [style, setStyle] = useState<StyleOptions>({ ...PRESETS[0].style });
  const [essence, setEssence] = useState<TextureEssence>(() => ({ ...DEFAULT_TEXTURE_ESSENCE, mix: { ...DEFAULT_TEXTURE_ESSENCE.mix } }));
  const [shape, setShape] = useState<ShapeOptions>(() => ({ ...DEFAULT_SHAPE_OPTIONS, decorations: [] }));
  const [animationMode, setAnimationMode] = useState<AnimationMode>('none');
  const [animationFrames, setAnimationFrames] = useState(6);
  const [frameTime, setFrameTime] = useState(2);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [seed, setSeed] = useState(20260214);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('すべて');
  const [tool, setTool] = useState<'brush' | 'eraser' | 'picker' | 'fill' | 'moveBody' | 'moveDecor'>('brush');
  const [selectedDecor, setSelectedDecor] = useState<Decoration | null>(null);
  const [showLayout, setShowLayout] = useState(true);
  const [brushColor, setBrushColor] = useState<string>(PRIMARY_MATERIALS[0].light);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(384);
  const [glint, setGlint] = useState(true);
  const [previewURL, setPreviewURL] = useState('');
  const [animationPreviewURL, setAnimationPreviewURL] = useState('');
  const [compareURL16, setCompareURL16] = useState('');
  const [compareURL64, setCompareURL64] = useState('');
  const [toast, setToast] = useState('');
  const [renderMetrics, setRenderMetrics] = useState<RenderMetrics | null>(null);
  const [blueprintName, setBlueprintName] = useState('Untitled Relic');
  const [blueprints, setBlueprints] = useState<BlueprintData[]>(() => loadBlueprintStore('skyblock-atelier-blueprints-v3'));
  const blueprintFileRef = useRef<HTMLInputElement>(null);
  const [minecraftTarget, setMinecraftTarget] = useState<MinecraftTarget>('universal');
  const [minecraftNamespace, setMinecraftNamespace] = useState('skyforge');
  const [baseItem, setBaseItem] = useState(DEFAULT_BASE_ITEM.sword);
  const [customModelData, setCustomModelData] = useState(10001);
  const [exportingProject, setExportingProject] = useState(false);

  const item = useMemo(() => ITEMS.find((i) => i.id === itemId) ?? ITEMS[0], [itemId]);
  const preset = useMemo(() => PRESETS.find((p) => p.id === presetId) ?? PRESETS[0], [presetId]);

  const [palette, setPalette] = useState<ItemDef['palette']>(() => ({
    ...ITEMS[0].palette,
    primary: PRIMARY_MATERIALS[0].color,
    light: PRIMARY_MATERIALS[0].light,
    dark: PRIMARY_MATERIALS[0].dark,
    accent: ACCENT_MATERIALS[0].color,
    handle: HANDLE_MATERIALS[0].color,
  }));

  const displayedPreview = animationMode === 'none' ? previewURL : (animationPreviewURL || previewURL);

  // Secondary previews lag behind the main canvas so dragging stays responsive.
  const deferredShape = useSettled(shape, 180);
  const deferredStyle = useSettled(style, 180);
  const deferredEssence = useSettled(essence, 180);
  // Item-list thumbnails ignore pure placement (body / decoration offsets): only a real
  // design change should re-render ~30 thumbnails.
  const thumbKey = JSON.stringify({
    ...shape, offsetX: 0, offsetY: 0, decorOffsetX: 0, decorOffsetY: 0,
    decorTweaks: canonicalTweaks(shape, true),
  });
  const thumbShape = useMemo(() => JSON.parse(thumbKey) as ShapeOptions, [thumbKey]);

  useEffect(() => {
    try { window.localStorage.setItem('skyblock-atelier-blueprints-v3', JSON.stringify(blueprints)); } catch { /* storage can be disabled */ }
  }, [blueprints]);

  const itemPaletteInitialized = useRef(false);
  useEffect(() => {
    if (!itemPaletteInitialized.current) {
      itemPaletteInitialized.current = true;
      return;
    }
    setPalette({ ...item.palette });
    setBrushColor(item.palette.light);
    setBaseItem(DEFAULT_BASE_ITEM[item.kind]);
  }, [itemId]); // eslint-disable-line react-hooks/exhaustive-deps

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const undoStack = useRef<ImageData[]>([]);
  const generatedBaseRef = useRef<ImageData | null>(null);
  const painting = useRef(false);
  const previewTimer = useRef<number | undefined>(undefined);

  const pushUndo = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    try {
      undoStack.current.push(ctx.getImageData(0, 0, c.width, c.height));
      if (undoStack.current.length > 24) undoStack.current.shift();
    } catch { /* noop */ }
  }, []);

  const regenerate = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    undoStack.current = [];
    setRenderMetrics(generateTexture(c, item, resolution, style, seed, palette, essence, undefined, shape));
    generatedBaseRef.current = c.getContext('2d')!.getImageData(0, 0, resolution, resolution);
    // PNG encoding + <img> swaps are the costliest part of a drag step; publish once input settles.
    window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => setPreviewURL(c.toDataURL('image/png')), 140);
  }, [item, resolution, style, seed, palette, essence, shape]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  // 16px comparison thumb (same seed/style = native detail proof)
  useEffect(() => {
    try {
      setCompareURL16(renderToDataURL(item, 16, style, seed, palette, essence, undefined, deferredShape));
      setCompareURL64(renderToDataURL(item, 64, style, seed, palette, essence, undefined, deferredShape));
    } catch { /* noop */ }
  }, [item, style, seed, palette, essence, deferredShape]);

  const variations = useMemo(() => [seed + 101, seed + 202, seed + 303, seed + 404], [seed]);
  const variationURLs = useMemo(() => {
    try {
      return variations.map((v) => ({ s: v, url: renderToDataURL(item, 32, style, v, palette, essence, undefined, deferredShape) }));
    } catch { return []; }
  }, [item, style, palette, essence, deferredShape, variations]);

  useEffect(() => {
    setAnimationFrame(0);
    if (animationMode === 'none') {
      setAnimationPreviewURL('');
      return;
    }
    const interval = window.setInterval(() => setAnimationFrame((frame) => (frame + 1) % animationFrames), frameTime * 50);
    return () => window.clearInterval(interval);
  }, [animationMode, animationFrames, frameTime]);

  useEffect(() => {
    if (animationMode === 'none') return;
    try {
      setAnimationPreviewURL(renderToDataURL(item, resolution, style, seed, palette, essence, { mode: animationMode, frame: animationFrame, frames: animationFrames }, deferredShape));
    } catch { /* keep the last valid frame visible */ }
  }, [item, resolution, style, seed, palette, essence, deferredShape, animationMode, animationFrame, animationFrames]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id)!;
    setPresetId(id);
    setStyle({ ...p.style });
    setEssence((current) => ({ ...current, mix: { ...PRESET_MIX[id] } }));
    showToast(`プリセット「${p.jp}」を適用`);
  };

  const randomize = () => {
    setSeed(Math.floor(Math.random() * 99999999));
    showToast('新しいバリエーションを生成');
  };

  const chaosForge = () => {
    const form = BASE_FORMS[Math.floor(Math.random() * BASE_FORMS.length)].id;
    const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)].id;
    const decorations = DECORATIONS.filter(() => Math.random() > 0.72).map((entry) => entry.id);
    const twin = TWIN_MODES[Math.floor(Math.random() * TWIN_MODES.length)].id;
    const primary = PRIMARY_MATERIALS[Math.floor(Math.random() * PRIMARY_MATERIALS.length)];
    const accent = ACCENT_MATERIALS[Math.floor(Math.random() * ACCENT_MATERIALS.length)];
    const handle = HANDLE_MATERIALS[Math.floor(Math.random() * HANDLE_MATERIALS.length)];
    setSeed(Math.floor(Math.random() * 99999999));
    setShape({
      ...DEFAULT_SHAPE_OPTIONS,
      form,
      decorations,
      amorphous: Math.random() > 0.7 ? Math.random() * 0.75 : Math.random() * 0.18,
      length: 0.72 + Math.random() * 0.58,
      width: 0.68 + Math.random() * 0.62,
      rotation: Math.round(-24 + Math.random() * 48),
      mirror: Math.random() > 0.5,
      twin,
      element,
      elementPower: 0.38 + Math.random() * 0.62,
      decorationScale: 0.8 + Math.random() * 0.5,
      decorationSpread: 0.8 + Math.random() * 0.55,
      // occasionally pull a back ornament in front of the body for a less predictable read
      decorTweaks: Object.fromEntries(decorations.filter(() => Math.random() > 0.8).map((id) => [id, { ...DEFAULT_DECOR_TWEAK, layer: Math.random() > 0.5 ? 'front' : 'back' }])),
    });
    setPalette((current) => ({ ...current, primary: primary.color, light: primary.light, dark: primary.dark, accent: accent.color, handle: handle.color }));
    setEssence((current) => ({
      ...current,
      silhouette: 0.48 + Math.random() * 0.52,
      runes: Math.random(), gems: Math.random(), wear: Math.random() * 0.6, glow: 0.35 + Math.random() * 0.65,
    }));
    setBlueprintName(`${element === 'none' ? 'Unbound' : element} ${form}`);
    showToast('CHAOS FORGE: 全パラメータを再構成');
  };

  const currentBlueprint = (name = blueprintName): BlueprintData => ({
    version: 3,
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name: name.trim() || 'Untitled Relic',
    createdAt: Date.now(),
    itemId,
    resolution,
    presetId,
    style: { ...style },
    essence: { ...essence, mix: { ...essence.mix } },
    shape: { ...shape, decorations: [...shape.decorations] },
    animation: { mode: animationMode, frames: animationFrames, frameTime },
    palette: { ...palette },
    seed,
  });

  const applyBlueprint = (blueprint: BlueprintData) => {
    setItemId(ITEMS.some((entry) => entry.id === blueprint.itemId) ? blueprint.itemId : ITEMS[0].id);
    setResolution(blueprint.resolution ?? 64);
    setPresetId(PRESETS.some((entry) => entry.id === blueprint.presetId) ? blueprint.presetId : 'reborn');
    setStyle({ ...PRESETS[0].style, ...blueprint.style });
    setEssence({ ...DEFAULT_TEXTURE_ESSENCE, ...blueprint.essence, mix: { ...DEFAULT_TEXTURE_ESSENCE.mix, ...blueprint.essence?.mix } });
    setShape({ ...DEFAULT_SHAPE_OPTIONS, ...blueprint.shape, decorations: [...(blueprint.shape?.decorations ?? [])] });
    setAnimationMode(blueprint.animation?.mode ?? 'none');
    setAnimationFrames(blueprint.animation?.frames ?? 6);
    setFrameTime(blueprint.animation?.frameTime ?? 2);
    setPalette({ ...(blueprint.palette ?? ITEMS[0].palette) });
    setSeed(blueprint.seed ?? Date.now());
    setBlueprintName(blueprint.name ?? 'Imported Relic');
    showToast(`設計図「${blueprint.name}」をロード`);
  };

  const saveBlueprint = () => {
    const blueprint = currentBlueprint();
    setBlueprints((current) => [blueprint, ...current].slice(0, 30));
    showToast(`設計図「${blueprint.name}」を保存`);
  };

  const downloadBlueprint = () => {
    const blueprint = currentBlueprint();
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${blueprint.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'atelier-blueprint'}.skyforge.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    showToast('設計図JSONを書き出し');
  };

  const importBlueprint = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<BlueprintData> | Partial<BlueprintData>[];
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const valid = list.filter((entry) => entry && entry.itemId && entry.style && entry.shape).map(normalizeBlueprint);
      if (!valid.length) throw new Error('No blueprint');
      setBlueprints((current) => [...valid, ...current].slice(0, 30));
      applyBlueprint(valid[0]);
    } catch {
      showToast('設計図JSONを読み込めませんでした');
    }
  };

  const downloadBatch = async () => {
    const zip = new JSZip();
    const folder = zip.folder(`batch_${item.id}`)!;
    const atlas = document.createElement('canvas');
    atlas.width = 64 * 4;
    atlas.height = 64 * 3;
    const atlasCtx = atlas.getContext('2d')!;
    atlasCtx.imageSmoothingEnabled = false;
    const manifest: { file: string; seed: number }[] = [];
    for (let index = 0; index < 12; index++) {
      const variantSeed = (seed + (index + 1) * 7919) >>> 0;
      const canvas = document.createElement('canvas');
      generateTexture(canvas, item, 64, style, variantSeed, palette, essence, undefined, shape);
      const file = `${item.id}_${String(index + 1).padStart(2, '0')}_${variantSeed}.png`;
      folder.file(file, canvas.toDataURL('image/png').split(',')[1], { base64: true });
      atlasCtx.drawImage(canvas, (index % 4) * 64, Math.floor(index / 4) * 64);
      manifest.push({ file, seed: variantSeed });
    }
    zip.file(`${item.id}_atlas_4x3.png`, atlas.toDataURL('image/png').split(',')[1], { base64: true });
    zip.file('manifest.json', JSON.stringify({ blueprint: currentBlueprint(), variants: manifest }, null, 2));
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `skyblock-atelier_${item.id}_12-variants.zip`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    showToast('64xバリエーション12種＋アトラスを書き出し');
  };

  const undo = () => {
    const c = canvasRef.current;
    if (!c || undoStack.current.length === 0) return;
    const ctx = c.getContext('2d')!;
    const prev = undoStack.current.pop()!;
    ctx.putImageData(prev, 0, 0);
    setPreviewURL(c.toDataURL('image/png'));
  };

  const transformPixels = (operation: 'left' | 'right' | 'up' | 'down' | 'flipX' | 'flipY' | 'rotate') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pushUndo();
    const ctx = canvas.getContext('2d')!;
    const source = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const output = ctx.createImageData(canvas.width, canvas.height);
    const N = canvas.width;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let tx = x, ty = y;
        if (operation === 'left') tx = x - 1;
        if (operation === 'right') tx = x + 1;
        if (operation === 'up') ty = y - 1;
        if (operation === 'down') ty = y + 1;
        if (operation === 'flipX') tx = N - 1 - x;
        if (operation === 'flipY') ty = N - 1 - y;
        if (operation === 'rotate') { tx = N - 1 - y; ty = x; }
        if (tx < 0 || ty < 0 || tx >= N || ty >= N) continue;
        const from = (y * N + x) * 4, to = (ty * N + tx) * 4;
        output.data[to] = source.data[from]; output.data[to + 1] = source.data[from + 1];
        output.data[to + 2] = source.data[from + 2]; output.data[to + 3] = source.data[from + 3];
      }
    }
    ctx.putImageData(output, 0, 0);
    setPreviewURL(canvas.toDataURL('image/png'));
    showToast(`ピクセル変形: ${operation}`);
  };

  // ---- layout editing (body / decoration move) ----
  const isMoveTool = tool === 'moveBody' || tool === 'moveDecor';
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const moveTarget = tool === 'moveBody' ? 'body' : selectedDecor && shape.decorations.includes(selectedDecor) ? selectedDecor : 'allDecor';
  const readOffset = (s: ShapeOptions) => moveTarget === 'body' ? { x: s.offsetX, y: s.offsetY }
    : moveTarget === 'allDecor' ? { x: s.decorOffsetX, y: s.decorOffsetY }
      : (({ x, y }) => ({ x, y }))(tweakOf(s, moveTarget));
  const writeOffset = useCallback((x: number, y: number) => {
    const cx = Math.max(-28, Math.min(28, Math.round(x)));
    const cy = Math.max(-28, Math.min(28, Math.round(y)));
    setShape((s) => {
      if (moveTarget === 'body') return s.offsetX === cx && s.offsetY === cy ? s : { ...s, offsetX: cx, offsetY: cy };
      if (moveTarget === 'allDecor') return s.decorOffsetX === cx && s.decorOffsetY === cy ? s : { ...s, decorOffsetX: cx, decorOffsetY: cy };
      const t = tweakOf(s, moveTarget);
      return t.x === cx && t.y === cy ? s : updateTweak(s, moveTarget, { x: cx, y: cy });
    });
  }, [moveTarget]);

  // Arrow keys nudge the current move target by 1px (Shift = 4px) while a move tool is active.
  useEffect(() => {
    if (!isMoveTool) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
      const k = e.shiftKey ? 4 : 1;
      const d = { ArrowLeft: [-k, 0], ArrowRight: [k, 0], ArrowUp: [0, -k], ArrowDown: [0, k] }[e.key];
      if (!d) return;
      e.preventDefault();
      const o = readOffset(shape);
      writeOffset(o.x + d[0], o.y + d[1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const layoutPoint = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * 64, y: ((e.clientY - rect.top) / rect.height) * 64 };
  };

  // ---- painting ----
  const posFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const cx = 'touches' in e ? (e as unknown as { touches: { clientX: number; clientY: number }[] }).touches[0].clientX : (e as React.MouseEvent).clientX;
    const cy = 'touches' in e ? (e as unknown as { touches: { clientX: number; clientY: number }[] }).touches[0].clientY : (e as React.MouseEvent).clientY;
    const x = Math.floor(((cx - rect.left) / rect.width) * resolution);
    const y = Math.floor(((cy - rect.top) / rect.height) * resolution);
    return { x: Math.max(0, Math.min(resolution - 1, x)), y: Math.max(0, Math.min(resolution - 1, y)) };
  };

  const floodFill = (sx: number, sy: number, color: string) => {
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    const si = (sy * c.width + sx) * 4;
    const tr = d[si], tg = d[si + 1], tb = d[si + 2], ta = d[si + 3];
    const tmp = document.createElement('canvas').getContext('2d')!;
    tmp.fillStyle = color;
    tmp.fillRect(0, 0, 1, 1);
    const fd = tmp.getImageData(0, 0, 1, 1).data;
    const fr = fd[0], fg = fd[1], fb = fd[2];
    if (tr === fr && tg === fg && tb === fb && ta === 255) return;
    const stack: [number, number][] = [[sx, sy]];
    const seen = new Set<number>();
    while (stack.length) {
      const [x, y] = stack.pop()!;
      if (x < 0 || y < 0 || x >= c.width || y >= c.height) continue;
      const k = y * c.width + x;
      if (seen.has(k)) continue;
      seen.add(k);
      const i = k * 4;
      if (d[i] !== tr || d[i + 1] !== tg || d[i + 2] !== tb || d[i + 3] !== ta) continue;
      d[i] = fr; d[i + 1] = fg; d[i + 2] = fb; d[i + 3] = 255;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    ctx.putImageData(img, 0, 0);
  };

  const paintAt = (x: number, y: number) => {
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    if (tool === 'brush') {
      ctx.fillStyle = brushColor;
      ctx.fillRect(x, y, 1, 1);
    } else if (tool === 'eraser') {
      ctx.clearRect(x, y, 1, 1);
    } else if (tool === 'picker') {
      const d = ctx.getImageData(x, y, 1, 1).data;
      if (d[3] > 10) {
        const hex = `#${[d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
        setBrushColor(hex);
        setTool('brush');
      }
      return;
    } else if (tool === 'fill') {
      floodFill(x, y, brushColor);
      return;
    }
  };

  const onPointerDown = (e: React.MouseEvent) => {
    if (isMoveTool) {
      const p = layoutPoint(e);
      const o = readOffset(shape);
      dragRef.current = { startX: p.x, startY: p.y, baseX: o.x, baseY: o.y };
      return;
    }
    if (tool === 'picker' || tool === 'fill') {
      pushUndo();
      const { x, y } = posFromEvent(e);
      paintAt(x, y);
      setPreviewURL(canvasRef.current!.toDataURL('image/png'));
      return;
    }
    painting.current = true;
    pushUndo();
    const { x, y } = posFromEvent(e);
    paintAt(x, y);
  };
  const onPointerMove = (e: React.MouseEvent) => {
    if (dragRef.current) {
      const p = layoutPoint(e);
      writeOffset(dragRef.current.baseX + (p.x - dragRef.current.startX), dragRef.current.baseY + (p.y - dragRef.current.startY));
      return;
    }
    if (!painting.current) return;
    const { x, y } = posFromEvent(e);
    paintAt(x, y);
  };
  const onPointerUp = () => {
    dragRef.current = null;
    if (painting.current) {
      painting.current = false;
      setPreviewURL(canvasRef.current!.toDataURL('image/png'));
    }
  };

  // ---- export ----
  const downloadPNG = (N: 16 | 32 | 64) => {
    const c = document.createElement('canvas');
    if (N === resolution && canvasRef.current && animationMode === 'none') {
      // export with manual edits
      const url = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.id}_${N}x_native.png`;
      a.click();
    } else {
      generateTexture(c, item, N, style, seed, palette, essence, animationMode === 'none' ? undefined : { mode: animationMode, frame: animationFrame, frames: animationFrames }, shape);
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = `${item.id}_${N}x_native.png`;
      a.click();
    }
    showToast(`${N}×${N} ネイティブPNGを書き出し`);
  };

  const mergeManualEdits = (target: HTMLCanvasElement, N: 16 | 32 | 64) => {
    if (N !== resolution || !canvasRef.current || !generatedBaseRef.current) return;
    const source = canvasRef.current.getContext('2d')!.getImageData(0, 0, N, N);
    const base = generatedBaseRef.current.data;
    const outputCtx = target.getContext('2d')!;
    const output = outputCtx.getImageData(0, 0, N, N);
    for (let i = 0; i < source.data.length; i += 4) {
      if (source.data[i] !== base[i] || source.data[i + 1] !== base[i + 1] || source.data[i + 2] !== base[i + 2] || source.data[i + 3] !== base[i + 3]) {
        output.data[i] = source.data[i];
        output.data[i + 1] = source.data[i + 1];
        output.data[i + 2] = source.data[i + 2];
        output.data[i + 3] = source.data[i + 3];
      }
    }
    outputCtx.putImageData(output, 0, 0);
  };

  const createAnimationSheet = (N: 16 | 32 | 64) => {
    const sheet = document.createElement('canvas');
    sheet.width = N;
    sheet.height = N * animationFrames;
    const ctx = sheet.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    for (let frame = 0; frame < animationFrames; frame++) {
      const frameCanvas = document.createElement('canvas');
      generateTexture(frameCanvas, item, N, style, seed, palette, essence, { mode: animationMode, frame, frames: animationFrames }, shape);
      mergeManualEdits(frameCanvas, N);
      ctx.drawImage(frameCanvas, 0, frame * N);
    }
    return sheet;
  };

  const animationMeta = () => ({
    animation: {
      frametime: frameTime,
      frames: Array.from({ length: animationFrames }, (_, frame) => frame),
      interpolate: false,
    },
  });

  const downloadAnimation = async () => {
    if (animationMode === 'none') {
      showToast('先にアニメーションタイプを選択してください');
      return;
    }
    const zip = new JSZip();
    const folder = zip.folder('assets/minecraft/textures/item')!;
    const fileName = `${item.id}_${resolution}x_anim.png`;
    const sheet = createAnimationSheet(resolution);
    folder.file(fileName, sheet.toDataURL('image/png').split(',')[1], { base64: true });
    folder.file(`${fileName}.mcmeta`, JSON.stringify(animationMeta(), null, 2));
    zip.file('pack.mcmeta', JSON.stringify({ pack: { pack_format: 15, description: `Skyblock Atelier animation - ${item.jp}` } }, null, 2));
    zip.file('ANIMATION.txt', `Skyblock Texture Atelier - animation export\nType: ${animationMode}\nFrames: ${animationFrames}\nFrame time: ${frameTime} ticks/frame\nSheet: ${resolution}x${resolution * animationFrames} PNG (frames stacked vertically)\n\nRename the PNG and matching .png.mcmeta together when installing.\n`);
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `skyblock-atelier_${item.id}_${animationMode}_${resolution}x.zip`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    showToast(`${animationFrames}フレームのアニメーションZIPを書き出し`);
  };

  const downloadPack = async () => {
    setExportingProject(true);
    try {
      const project = await buildMinecraftProject({
        projectName: blueprintName || item.name,
        namespace: minecraftNamespace,
        baseItem,
        customModelData,
        item,
        resolution,
        style,
        essence,
        shape,
        animation: { mode: animationMode, frames: animationFrames, frameTime },
        palette,
        seed,
        blueprint: currentBlueprint(),
      }, minecraftTarget);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(project.blob);
      a.download = project.filename;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      showToast(`${MINECRAFT_TARGETS.find((target) => target.id === minecraftTarget)?.label}を書き出し`);
    } catch {
      showToast('Minecraftプロジェクトの構築に失敗しました');
    } finally {
      setExportingProject(false);
    }
  };

  const filtered = useMemo(() => ITEMS.filter((i) =>
    (category === 'すべて' || i.category === category) &&
    (search === '' || i.name.toLowerCase().includes(search.toLowerCase()) || i.jp.includes(search))
  ), [category, search]);

  const setS = (k: keyof StyleOptions, v: number) => setStyle((s) => ({ ...s, [k]: v }));
  const setEssenceValue = (k: keyof Omit<TextureEssence, 'mix'>, v: number) => setEssence((current) => ({ ...current, [k]: v }));
  const setMixValue = (k: keyof TextureEssence['mix'], v: number) => setEssence((current) => ({ ...current, mix: { ...current.mix, [k]: v } }));
  const mixSum = Object.values(essence.mix).reduce((sum, value) => sum + value, 0);
  const mixWidth = (value: number) => `${mixSum > 0 ? (value / mixSum) * 100 : 25}%`;
  const normalizePackMix = () => {
    setEssence((current) => {
      const total = Object.values(current.mix).reduce((sum, value) => sum + value, 0);
      if (total <= 0) return current;
      return { ...current, mix: {
        furfsky: current.mix.furfsky / total,
        vanilla: current.mix.vanilla / total,
        imperial: current.mix.imperial / total,
        faithful: current.mix.faithful / total,
      } };
    });
  };
  const applyPrimaryMaterial = (material: typeof PRIMARY_MATERIALS[number]) => setPalette((current) => ({ ...current, primary: material.color, light: material.light, dark: material.dark }));
  const applyRoleMaterial = (role: 'accent' | 'handle', color: string) => setPalette((current) => ({ ...current, [role]: color }));
  const resetRole = (role: OverrideRole) => {
    if (role === 'primary') setPalette((current) => ({ ...current, primary: item.palette.primary, light: item.palette.light, dark: item.palette.dark }));
    else setPalette((current) => ({ ...current, [role]: item.palette[role] }));
  };

  const setForm = (form: BaseForm) => {
    setShape((current) => ({ ...current, form }));
    showToast(`基本形「${BASE_FORMS.find((f) => f.id === form)?.jp}」を適用`);
  };
  const activeForm = BASE_FORMS.find((f) => f.id === shape.form) ?? BASE_FORMS[0];

  const pixelCount = resolution * resolution;
  const detailScore = Math.round((resolution / 64) * 60 + (style.grain / 100) * 12 + (style.bevel / 100) * 14 + (style.highlight / 100) * 14);
  const combinationCount = BASE_FORMS.length * (2 ** DECORATIONS.length) * TWIN_MODES.length * ELEMENTS.length * 101;

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* bg */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070a14]" />
        <div className="absolute inset-0 opacity-[0.5]" style={{ backgroundImage: 'radial-gradient(rgba(245,197,66,.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -left-40 h-[380px] w-[380px] rounded-full bg-fuchsia-600/10 blur-[100px]" />
        <div className="absolute -right-40 bottom-0 h-[380px] w-[380px] rounded-full bg-amber-500/10 blur-[100px]" />
      </div>

      {/* header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0e1f]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-600 shadow-[0_0_24px_rgba(245,197,66,.4)]">
              <Hammer className="h-5 w-5 text-black" />
            </div>
            <div>
              <h1 className="font-pixel text-[15px] leading-none text-white sm:text-lg">SKYBLOCK TEXTURE ATELIER</h1>
              <p className="mt-1 text-[11px] text-slate-400">FurfSky系エッセンス凝縮・<span className="text-amber-300">64×64ネイティブ</span> ジェネレーター＋手描きエディタ</p>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-1">
              {([16, 32, 64] as const).map((N) => (
                <button
                  key={N}
                  onClick={() => setResolution(N)}
                  className={`rounded-lg px-3 py-1.5 font-pixel text-[12px] transition-all ${resolution === N ? 'bg-amber-400 text-black shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  {N}×
                </button>
              ))}
              <span className="mx-1 hidden items-center gap-1 rounded-md bg-emerald-400/15 px-2 py-1 text-[10px] font-bold text-emerald-300 sm:flex">
                <Cpu className="h-3 w-3" /> NATIVE
              </span>
            </div>
            <button onClick={randomize} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-bold text-slate-200 hover:border-amber-400/50 hover:text-amber-300">
              <Dices className="h-4 w-4" /> ランダム
            </button>
            <button onClick={chaosForge} className="flex items-center gap-1.5 rounded-xl border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-2 text-[12px] font-black text-fuchsia-200 hover:bg-fuchsia-400/20">
              <Shuffle className="h-4 w-4" /> CHAOS
            </button>
            <button onClick={downloadPack} className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-[12px] font-black text-black shadow-[0_0_20px_rgba(245,197,66,.35)] hover:bg-amber-300">
              <FileArchive className="h-4 w-4" /> PACK.ZIP
            </button>
          </div>
        </div>
        {/* stat strip */}
        <div className="border-t border-white/5 bg-black/30">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-5 gap-y-1 px-4 py-1.5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><Layers className="h-3 w-3 text-amber-400" /> 解像度 <b className="text-white">{resolution}×{resolution}</b>（{pixelCount.toLocaleString()}px・拡大ではなく<b className="text-emerald-300">各解像度で個別レンダリング</b>）</span>
            <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-fuchsia-400" /> 精密スコア <b className="text-white">{detailScore}</b>/100</span>
            <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-cyan-300" /> プリセット <b className="text-white">{preset.jp}</b>（{preset.tag}）</span>
            <span className="flex items-center gap-1"><Swords className="h-3 w-3 text-emerald-300" /> 基本形 <b className="text-white">{activeForm.jp}</b>{shape.twin !== 'single' && <span>・<b className="text-sky-200">{TWIN_MODES.find((mode) => mode.id === shape.twin)?.jp}</b></span>}{shape.decorations.length > 0 && <span>・装飾 <b className="text-rose-200">{shape.decorations.length}</b></span>}{shape.amorphous > 0.02 && <span>・不定形 <b className="text-violet-200">{shape.amorphous.toFixed(2)}</b></span>}{shape.element !== 'none' && <span>・属性 <b style={{ color: ELEMENTS.find((element) => element.id === shape.element)?.color }}>{ELEMENTS.find((element) => element.id === shape.element)?.jp}</b></span>}</span>
            <span className="flex items-center gap-1"><Clock3 className="h-3 w-3 text-violet-300" /> ANIM <b className="text-white">{animationMode}</b>{animationMode !== 'none' && <span className="font-mono">· {animationFrames}f / {frameTime}t</span>}</span>
            <span className="hidden items-center gap-1 md:flex"><Eye className="h-3 w-3 text-slate-500" /> SEED <b className="font-mono text-amber-300">{seed}</b></span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-4 px-4 py-4 lg:grid-cols-[288px_minmax(0,1fr)_330px]">
        {/* LEFT: items */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-[104px] lg:max-h-[calc(100vh-120px)]">
          <div className="rounded-2xl border border-white/10 bg-[#0e1328]/80 p-3 backdrop-blur">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hyperion / ハイペリオン…" className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-[13px] text-white outline-none placeholder:text-slate-600 focus:border-amber-400/60" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`rounded-lg px-2 py-1 text-[11px] font-bold ${category === c ? 'bg-amber-400 text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}>{c}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto rounded-2xl border border-white/10 bg-[#0e1328]/80 p-2 backdrop-blur lg:max-h-none">
            <p className="px-2 pb-1 pt-1 text-[11px] font-bold tracking-widest text-slate-500">{filtered.length} ITEMS — 生成対象を選択</p>
            {filtered.map((it) => (
              <ItemThumb key={it.id} item={it} active={it.id === itemId} style={deferredStyle} essence={deferredEssence} shape={thumbShape} onSelect={setItemId} />
            ))}
          </div>
        </aside>

        {/* CENTER */}
        <section className="flex min-w-0 flex-col gap-4">
          {/* editor */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e1328]/80 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-black/20 px-4 py-2.5">
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
                {([
                  { id: 'brush', icon: Brush, label: 'ブラシ' },
                  { id: 'eraser', icon: Eraser, label: '消しゴム' },
                  { id: 'picker', icon: Pipette, label: 'スポイト' },
                  { id: 'fill', icon: PaintBucket, label: '塗りつぶし' },
                  { id: 'moveBody', icon: Crosshair, label: '本体を移動（ドラッグ／矢印キー）' },
                  { id: 'moveDecor', icon: Move, label: '装飾だけ移動（選択中の装飾、未選択なら全装飾）' },
                ] as const).map((t) => (
                  <button key={t.id} title={t.label} onClick={() => setTool(t.id)} className={`rounded-lg p-2 ${tool === t.id ? 'bg-amber-400 text-black' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                    <t.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded-lg border border-white/20 bg-transparent" />
                <div className="hidden flex-wrap gap-1 sm:flex">
                  {[...new Set([palette.primary, palette.light, palette.dark, palette.accent, palette.handle, palette.extra ?? '#ffffff', '#ffffff', '#0a0c16'])].slice(0, 8).map((c) => (
                    <button key={c} onClick={() => { setBrushColor(c!); setTool('brush'); }} className={`h-6 w-6 rounded-md border ${brushColor === c ? 'border-amber-300 ring-2 ring-amber-300/40' : 'border-black/60'}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => setShowLayout(!showLayout)} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${showLayout ? 'bg-amber-400/15 text-amber-200' : 'bg-white/5 text-slate-500'}`}>
                  <Crosshair className="h-3.5 w-3.5" /> ガイド
                </button>
                <button onClick={() => setShowGrid(!showGrid)} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${showGrid ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/5 text-slate-500'}`}>
                  <Grid3X3 className="h-3.5 w-3.5" /> グリッド
                </button>
                <button onClick={undo} className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-white/10">
                  <Undo2 className="h-3.5 w-3.5" /> 戻す
                </button>
                <button onClick={regenerate} className="flex items-center gap-1 rounded-lg bg-fuchsia-500/20 px-2.5 py-1.5 text-[11px] font-bold text-fuchsia-300 hover:bg-fuchsia-500/30">
                  <Wand2 className="h-3.5 w-3.5" /> 再生成
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 border-b border-white/5 bg-black/10 px-4 py-1.5">
              <span className="mr-1 text-[9px] font-bold tracking-widest text-slate-600">PIXEL TRANSFORM</span>
              {([
                ['left', ArrowLeft, '1px左'], ['right', ArrowRight, '1px右'], ['up', ArrowUp, '1px上'], ['down', ArrowDown, '1px下'],
                ['flipX', FlipHorizontal2, '水平反転'], ['flipY', FlipVertical2, '垂直反転'], ['rotate', RotateCw, '90°回転'],
              ] as const).map(([operation, Icon, label]) => (
                <button key={operation} onClick={() => transformPixels(operation)} title={label} className="rounded-md bg-white/5 p-1.5 text-slate-500 hover:bg-white/10 hover:text-cyan-200"><Icon className="h-3.5 w-3.5" /></button>
              ))}
              <span className="ml-auto text-[9px] text-slate-700">生成設定ではなく現在のキャンバスを正確に1px操作</span>
            </div>

            <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <div className="checker relative mx-auto flex items-center justify-center overflow-hidden rounded-2xl border border-black/60" style={{ maxWidth: zoom + 32 }}>
                  <div className="relative m-4" style={{ width: zoom, height: zoom }}>
                    <canvas
                      ref={canvasRef}
                      width={resolution} height={resolution}
                      className={`pixelated absolute inset-0 h-full w-full touch-none ${isMoveTool ? 'cursor-move' : 'cursor-crosshair'}`}
                      onMouseDown={onPointerDown} onMouseMove={onPointerMove} onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
                    />
                    {showGrid && (
                      <div className="grid-overlay pointer-events-none absolute inset-0" style={{ backgroundSize: `${zoom / resolution}px ${zoom / resolution}px` }} />
                    )}
                    {showLayout && renderMetrics?.layout && (() => {
                      const k = zoom / 64;
                      const L = renderMetrics.layout;
                      const box = (b: { x: number; y: number; width: number; height: number }, cls: string) => (
                        <div className={`pointer-events-none absolute border ${cls}`} style={{ left: b.x * k, top: b.y * k, width: b.width * k, height: b.height * k }} />
                      );
                      const selLayer = L.layers.find((l) => l.id === (tool === 'moveBody' ? 'body' : selectedDecor));
                      return (
                        <>
                          {L.safe && box(L.safe, 'border-dashed border-emerald-300/45')}
                          {selLayer?.box && box(selLayer.box, tool === 'moveBody' ? 'border-amber-300/80' : 'border-rose-300/80')}
                          <div className="pointer-events-none absolute" style={{ left: L.anchor.x * k - 7, top: L.anchor.y * k - 7, width: 14, height: 14 }}>
                            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-amber-300/90" />
                            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-amber-300/90" />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <span className="absolute left-3 top-3 rounded-lg bg-black/70 px-2 py-1 font-pixel text-[11px] text-emerald-300">● {resolution}×{resolution} NATIVE</span>
                  <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2 py-1 text-[10px] text-slate-400">{isMoveTool
                    ? <>移動対象: <b className={tool === 'moveBody' ? 'text-amber-200' : 'text-rose-200'}>{moveTarget === 'body' ? '本体' : moveTarget === 'allDecor' ? '全装飾' : DECORATIONS.find((d) => d.id === moveTarget)?.jp}</b> {readOffset(shape).x},{readOffset(shape).y} ・ ドラッグ / ←↑→↓ (Shift 4px) ・ 縮小率 {renderMetrics?.layout.fitScale.toFixed(2)}</>
                    : <>1px = {(zoom / resolution).toFixed(1)}px表示・クリックで直接ドット修正可</>}</span>
                </div>
                <div className="mt-3 flex items-center gap-3 px-1">
                  <span className="text-[11px] font-bold text-slate-400">表示ズーム</span>
                  <input type="range" min={192} max={560} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1" style={{ ['--fill' as string]: `${((zoom - 192) / (560 - 192)) * 100}%` }} />
                  <span className="font-pixel text-[12px] text-amber-300">{zoom}px</span>
                </div>
                {/* variations */}
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-slate-300"><Dices className="h-4 w-4 text-amber-400" /> シードバリエーション — 気に入った個体をクリックで採用</p>
                  <div className="grid grid-cols-4 gap-2">
                    {variationURLs.map((v) => (
                      <button key={v.s} onClick={() => { setSeed(v.s); showToast(`シード ${v.s} を採用`); }} className="group overflow-hidden rounded-xl border border-white/10 bg-[#141a33] hover:border-amber-400/60">
                        <img src={v.url} alt={`seed ${v.s}`} className="pixelated aspect-square w-full" />
                        <span className="block truncate px-1 py-1 font-mono text-[10px] text-slate-500 group-hover:text-amber-300">#{String(v.s).slice(-6)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* minecraft preview column */}
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                  <p className="mb-2 text-[11px] font-bold tracking-widest text-slate-500">MINECRAFT 実機プレビュー</p>
                  {/* tooltip */}
                  <div className="mc-tooltip relative rounded-md p-3">
                    <p className="text-[14px] font-bold" style={{ color: RARITY_COLOR[item.rarity] }}>{item.name}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">{item.jp} ・ {RARITY_JP[item.rarity]} {item.kind.toUpperCase()}</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">{item.damage}</p>
                    <p className="mt-1 text-[11px] italic leading-relaxed text-slate-500">{item.desc}</p>
                    <p className="mt-1.5 text-[10px] text-slate-600">SEED {seed} ・ {resolution}× NATIVE ・ {preset.jp}</p>
                    {displayedPreview && (
                      <img src={displayedPreview} className={`pixelated animate-float-slow absolute -right-2 -top-8 h-16 w-16 drop-shadow-[0_6px_16px_rgba(0,0,0,.7)] ${glint ? 'enchant-glint overflow-hidden rounded' : ''}`} alt="preview" />
                    )}
                  </div>
                  {/* inventory */}
                  <div className="mt-3 rounded-xl border border-[#2e3350] bg-[#0d1020] p-2">
                    <p className="mb-1.5 px-1 text-[10px] text-slate-500">Inventory — 地面・チェスト内での見え方</p>
                    <div className="grid grid-cols-9 gap-1">
                      {Array.from({ length: 27 }).map((_, i) => (
                        <div key={i} className="mc-slot relative aspect-square rounded-[4px]">
                          {i === 13 && displayedPreview && <img src={displayedPreview} className={`pixelated absolute inset-[6%] h-[88%] w-[88%] ${glint ? 'enchant-glint' : ''}`} alt="" />}
                          {i === 4 && <div className="absolute inset-[12%] rounded-sm bg-white/5" />}
                          {(i === 11 || i === 15) && <div className="absolute inset-[18%] rounded-sm bg-white/[0.04]" />}
                        </div>
                      ))}
                    </div>
                    <div className="mt-1 grid grid-cols-9 gap-1">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className={`mc-slot relative aspect-square rounded-[4px] ${i === 4 ? 'outline outline-2 outline-white/70' : ''}`}>
                          {i === 4 && displayedPreview && <img src={displayedPreview} className={`pixelated absolute inset-[6%] h-[88%] w-[88%] ${glint ? 'enchant-glint' : ''}`} alt="" />}
                          {i === 4 && <span className="absolute bottom-0.5 right-1 font-mono text-[10px] text-white drop-shadow">1</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px] text-slate-400">
                    <input type="checkbox" checked={glint} onChange={(e) => setGlint(e.target.checked)} className="h-3.5 w-3.5 accent-fuchsia-500" />
                    エンチャントの輝き（Enchant Glint）を重ねる
                  </label>
                </div>

                {/* palette */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-bold tracking-widest text-slate-300">OVERRIDE MATERIALS</p>
                    <button onClick={() => setPalette({ ...item.palette })} className="text-[10px] font-bold text-slate-500 hover:text-amber-300">ALL RESET</button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="mb-1.5 flex items-center gap-2">
                        <input aria-label="Primary custom color" type="color" value={palette.primary} onChange={(e) => setPalette((p) => ({ ...p, primary: e.target.value }))} className="h-7 w-9 cursor-pointer rounded-md border border-white/20 bg-transparent" />
                        <span className="flex-1 text-[11px] font-bold text-slate-200">Primary <span className="font-normal text-slate-500">本体</span></span>
                        <span className="font-mono text-[9px] uppercase text-slate-600">{palette.primary}</span>
                        <button onClick={() => resetRole('primary')} className="rounded-md bg-white/5 px-1.5 py-1 text-[9px] font-bold text-slate-500 hover:text-white">reset</button>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {PRIMARY_MATERIALS.map((material) => (
                          <button key={material.id} title={`${material.jp} · ${material.en}`} onClick={() => applyPrimaryMaterial(material)} className={`flex items-center gap-1 rounded-md border px-1 py-1 ${palette.primary === material.color ? 'border-amber-300/70 bg-amber-300/10' : 'border-white/5 bg-white/[0.025] hover:border-white/20'}`}>
                            <span className="h-3 w-3 shrink-0 rounded-sm border border-white/20" style={{ background: material.color }} />
                            <span className="truncate text-[9px] text-slate-300">{material.jp}</span>
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-right text-[9px] text-slate-600">{PRIMARY_MATERIALS.find((material) => material.color === palette.primary)?.en ?? 'Custom'} · light/shadow ramp included</p>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center gap-2">
                        <input aria-label="Accent custom color" type="color" value={palette.accent} onChange={(e) => setPalette((p) => ({ ...p, accent: e.target.value }))} className="h-7 w-9 cursor-pointer rounded-md border border-white/20 bg-transparent" />
                        <span className="flex-1 text-[11px] font-bold text-slate-200">Accent <span className="font-normal text-slate-500">装飾</span></span>
                        <span className="font-mono text-[9px] uppercase text-slate-600">{palette.accent}</span>
                        <button onClick={() => resetRole('accent')} className="rounded-md bg-white/5 px-1.5 py-1 text-[9px] font-bold text-slate-500 hover:text-white">reset</button>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {ACCENT_MATERIALS.map((material) => (
                          <button key={material.id} title={`${material.jp} · ${material.en}`} onClick={() => applyRoleMaterial('accent', material.color)} className={`flex items-center gap-1 rounded-md border px-1 py-1 ${palette.accent === material.color ? 'border-amber-300/70 bg-amber-300/10' : 'border-white/5 bg-white/[0.025] hover:border-white/20'}`}>
                            <span className="h-3 w-3 shrink-0 rounded-sm border border-white/20" style={{ background: material.color }} />
                            <span className="truncate text-[9px] text-slate-300">{material.jp}</span>
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-right text-[9px] text-slate-600">{ACCENT_MATERIALS.find((material) => material.color === palette.accent)?.en ?? 'Custom'}</p>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center gap-2">
                        <input aria-label="Handle custom color" type="color" value={palette.handle} onChange={(e) => setPalette((p) => ({ ...p, handle: e.target.value }))} className="h-7 w-9 cursor-pointer rounded-md border border-white/20 bg-transparent" />
                        <span className="flex-1 text-[11px] font-bold text-slate-200">Handle <span className="font-normal text-slate-500">柄 / 革</span></span>
                        <span className="font-mono text-[9px] uppercase text-slate-600">{palette.handle}</span>
                        <button onClick={() => resetRole('handle')} className="rounded-md bg-white/5 px-1.5 py-1 text-[9px] font-bold text-slate-500 hover:text-white">reset</button>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {HANDLE_MATERIALS.map((material) => (
                          <button key={material.id} title={`${material.jp} · ${material.en}`} onClick={() => applyRoleMaterial('handle', material.color)} className={`flex items-center gap-1 rounded-md border px-1 py-1 ${palette.handle === material.color ? 'border-amber-300/70 bg-amber-300/10' : 'border-white/5 bg-white/[0.025] hover:border-white/20'}`}>
                            <span className="h-3 w-3 shrink-0 rounded-sm border border-white/20" style={{ background: material.color }} />
                            <span className="truncate text-[9px] text-slate-300">{material.jp}</span>
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-right text-[9px] text-slate-600">{HANDLE_MATERIALS.find((material) => material.color === palette.handle)?.en ?? 'Custom'}</p>
                    </div>
                  </div>

                  <details className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-2">
                    <summary className="cursor-pointer text-[10px] font-bold text-slate-400">光沢・影・ジェムも直接編集</summary>
                    <div className="mt-2 space-y-1.5">
                      {([
                        ['light', 'ハイライト'], ['dark', 'シャドウ'], ['extra', 'ジェム / ルーン'],
                      ] as const).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2">
                          <input aria-label={label} type="color" value={palette[key] ?? '#ffffff'} onChange={(e) => setPalette((p) => ({ ...p, [key]: e.target.value }))} className="h-6 w-8 cursor-pointer rounded border border-white/20 bg-transparent" />
                          <span className="text-[10px] text-slate-400">{label}</span>
                          <span className="ml-auto font-mono text-[9px] text-slate-600">{palette[key]}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>

          {/* 16 vs 64 proof + export */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/20 bg-[#0c1a16]/80 p-4">
              <p className="flex items-center gap-1.5 text-[13px] font-black text-emerald-300"><Cuboid className="h-4 w-4" /> 64×64ネイティブ実装の証明</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">同じシード・同じスタイルで<b className="text-white">16pxと64pxをそれぞれ独立レンダリング</b>。拡大コピーではなく、64pxでは金属の傷・ルーン・ベベルの描き込みが増えることを確認できます。</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/40 p-2 text-center">
                  {compareURL16 && <img src={compareURL16} className="pixelated mx-auto h-28 w-28" alt="16 native" />}
                  <p className="mt-1 font-pixel text-[11px] text-slate-400">16×16 <span className="text-slate-600">256px</span></p>
                </div>
                <div className="rounded-xl border border-emerald-400/30 bg-black/40 p-2 text-center shadow-[0_0_20px_rgba(52,211,153,.12)]">
                  {compareURL64 && <img src={compareURL64} className="pixelated mx-auto h-28 w-28" alt="64 native" />}
                  <p className="mt-1 font-pixel text-[11px] text-emerald-300">64×64 <span className="text-emerald-600">4,096px・16倍の情報量</span></p>
                </div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${(pixelCount / 4096) * 100}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0e1328]/80 p-4">
              <p className="flex items-center gap-1.5 text-[13px] font-black text-white"><Package className="h-4 w-4 text-amber-400" /> MINECRAFT PROJECT EXPORT</p>
              <div className="mt-3 space-y-2 rounded-xl border border-white/5 bg-black/25 p-2.5">
                <label className="block text-[9px] font-bold text-slate-500">TARGET<select value={minecraftTarget} onChange={(e) => setMinecraftTarget(e.target.value as MinecraftTarget)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-[10px] text-white">{MINECRAFT_TARGETS.map((target) => <option key={target.id} value={target.id}>{target.label} — {target.detail}</option>)}</select></label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[9px] font-bold text-slate-500">NAMESPACE<input value={minecraftNamespace} onChange={(e) => setMinecraftNamespace(e.target.value)} className="mt-1 w-full rounded bg-black/50 px-2 py-1 font-mono text-[10px] text-cyan-200" /></label>
                  <label className="text-[9px] font-bold text-slate-500">BASE ITEM<select value={baseItem} onChange={(e) => setBaseItem(e.target.value)} className="mt-1 w-full rounded bg-black/50 px-2 py-1 text-[10px] text-white">{BASE_ITEM_OPTIONS.map((base) => <option key={base} value={base}>{base}</option>)}</select></label>
                </div>
                {(minecraftTarget === 'cmd_1_20_1' || minecraftTarget === 'universal') && <label className="flex items-center gap-2 text-[9px] font-bold text-slate-500">CUSTOM MODEL DATA<input type="number" min={1} value={customModelData} onChange={(e) => setCustomModelData(Math.max(1, Math.round(Number(e.target.value))))} className="min-w-0 flex-1 rounded bg-black/50 px-2 py-1 font-mono text-[10px] text-amber-200" /></label>}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {([16, 32, 64] as const).map((N) => (
                  <button key={N} onClick={() => downloadPNG(N)} className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[12px] font-bold ${N === resolution ? 'border-amber-400/60 bg-amber-400/10 text-amber-300' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'}`}>
                    <ImageIcon className="h-4 w-4" /> {N}×{N}.png
                    <span className="text-[10px] font-normal opacity-60">{N === resolution ? '手描き込反映' : 'ネイティブ生成'}</span>
                  </button>
                ))}
              </div>
              <button onClick={downloadPack} disabled={exportingProject} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-2.5 text-[13px] font-black text-black hover:brightness-110 disabled:cursor-wait disabled:opacity-50">
                <Download className="h-4 w-4" /> {exportingProject ? 'PROJECT BUILDING…' : `${MINECRAFT_TARGETS.find((target) => target.id === minecraftTarget)?.label} を作成`}
              </button>
              <button onClick={downloadAnimation} disabled={animationMode === 'none'} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-fuchsia-300/25 bg-fuchsia-400/10 py-2 text-[12px] font-bold text-fuchsia-200 enabled:hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-40">
                <Sparkles className="h-4 w-4" /> {animationMode === 'none' ? 'アニメーションZIP（効果を選択）' : `ANIMATION ZIP · ${animationMode} / ${animationFrames} frames`}
              </button>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">Universalは、1.8.9 CIT、1.20.1 CustomModelData、1.21.5+ Item Model Definition、対応Data Pack、Fabric/Forge/NeoForge用assets、全解像度テクスチャを個別の導入可能ZIPとして同梱します。</p>
            </div>
          </div>
        </section>

        {/* RIGHT: style DNA */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[104px] lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pb-2">
          <div className="rounded-2xl border border-emerald-300/25 bg-[#0e1328]/90 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[13px] font-black text-white"><Swords className="h-4 w-4 text-emerald-300" /> 基本形 BASE FORM</p>
              <button onClick={() => setShape((c) => ({ ...c, form: 'auto' }))} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-emerald-200"><RotateCcw className="h-3 w-3" /> AUTO</button>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">アイテム固有の形を無視して、武器そのもののシルエットを差し替えます。現在の構成系だけで約 <b className="text-emerald-200">{combinationCount.toLocaleString()}</b> 通り（連続スライダーとシードを除く）。</p>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {BASE_FORMS.map((f) => (
                <button key={f.id} title={f.desc} onClick={() => setForm(f.id)} className={`rounded-lg border px-1.5 py-1.5 text-left transition-colors ${shape.form === f.id ? 'border-emerald-300/70 bg-emerald-300/10' : 'border-white/5 bg-black/25 hover:border-white/20'}`}>
                  <span className={`block truncate text-[11px] font-bold ${shape.form === f.id ? 'text-emerald-200' : 'text-slate-300'}`}>{f.jp}</span>
                  <span className="block truncate font-mono text-[9px] text-slate-600">{f.en}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 rounded-lg bg-black/30 p-2 text-[10px] leading-relaxed text-slate-400">{activeForm.desc}</p>
          </div>

          <div className="rounded-2xl border border-sky-300/20 bg-[#0e1328]/90 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[13px] font-black text-white"><SlidersHorizontal className="h-4 w-4 text-sky-300" /> GEOMETRY LAB</p>
              <button onClick={() => setShape((c) => ({ ...c, length: 1, width: 1, rotation: 0, mirror: false, flipX: false, flipY: false, twin: 'single', offsetX: 0, offsetY: 0, pivot: 'center', pivotX: 32, pivotY: 32, autoFit: true, fitPadding: 3 }))} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-sky-200"><RotateCcw className="h-3 w-3" /> RESET</button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              <EssenceSlider label="LENGTH" jp="全長" value={shape.length} max={1.5} onChange={(v) => setShape((c) => ({ ...c, length: Math.max(0.5, v) }))} />
              <EssenceSlider label="WIDTH" jp="横幅" value={shape.width} max={1.5} onChange={(v) => setShape((c) => ({ ...c, width: Math.max(0.5, v) }))} />
            </div>
            <div className="mt-3 rounded-xl border border-white/5 bg-black/25 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-wider text-slate-300">BASE POSITION · 64px座標</span>
                <span className="font-mono text-[10px] text-sky-200">X {shape.offsetX > 0 ? '+' : ''}{shape.offsetX} / Y {shape.offsetY > 0 ? '+' : ''}{shape.offsetY}</span>
              </div>
              <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <label className="text-[9px] text-slate-500">X<input type="number" min={-24} max={24} value={shape.offsetX} onChange={(e) => setShape((c) => ({ ...c, offsetX: Math.max(-24, Math.min(24, Math.round(Number(e.target.value)))) }))} className="ml-1 w-12 rounded bg-black/50 px-1 py-1 font-mono text-sky-200" /></label>
                <div className="grid grid-cols-3 gap-1">
                  <span /><button onClick={() => setShape((c) => ({ ...c, offsetY: Math.max(-24, c.offsetY - 1) }))} title="上へ1px" className="rounded bg-white/5 p-1 hover:text-sky-200"><ArrowUp className="h-3 w-3" /></button><span />
                  <button onClick={() => setShape((c) => ({ ...c, offsetX: Math.max(-24, c.offsetX - 1) }))} title="左へ1px" className="rounded bg-white/5 p-1 hover:text-sky-200"><ArrowLeft className="h-3 w-3" /></button>
                  <button onClick={() => setShape((c) => ({ ...c, offsetX: 0, offsetY: 0 }))} title="中央へ" className="rounded bg-white/5 p-1 text-[8px] font-black hover:text-white">0</button>
                  <button onClick={() => setShape((c) => ({ ...c, offsetX: Math.min(24, c.offsetX + 1) }))} title="右へ1px" className="rounded bg-white/5 p-1 hover:text-sky-200"><ArrowRight className="h-3 w-3" /></button>
                  <span /><button onClick={() => setShape((c) => ({ ...c, offsetY: Math.min(24, c.offsetY + 1) }))} title="下へ1px" className="rounded bg-white/5 p-1 hover:text-sky-200"><ArrowDown className="h-3 w-3" /></button><span />
                </div>
                <label className="text-right text-[9px] text-slate-500">Y<input type="number" min={-24} max={24} value={shape.offsetY} onChange={(e) => setShape((c) => ({ ...c, offsetY: Math.max(-24, Math.min(24, Math.round(Number(e.target.value)))) }))} className="ml-1 w-12 rounded bg-black/50 px-1 py-1 font-mono text-sky-200" /></label>
              </div>
              <div className="mt-2 flex items-center gap-1">
                {(['center', 'hilt', 'head', 'custom'] as const).map((pivot) => <button key={pivot} onClick={() => setShape((c) => ({ ...c, pivot }))} className={`flex-1 rounded py-1 font-mono text-[8px] ${shape.pivot === pivot ? 'bg-sky-300/15 text-sky-200' : 'bg-white/5 text-slate-600'}`}>{pivot}</button>)}
              </div>
              {shape.pivot === 'custom' && <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] text-slate-500"><label>PIVOT X <input type="number" min={0} max={64} value={shape.pivotX} onChange={(e) => setShape((c) => ({ ...c, pivotX: Number(e.target.value) }))} className="w-12 rounded bg-black/50 p-1 font-mono text-white" /></label><label>PIVOT Y <input type="number" min={0} max={64} value={shape.pivotY} onChange={(e) => setShape((c) => ({ ...c, pivotY: Number(e.target.value) }))} className="w-12 rounded bg-black/50 p-1 font-mono text-white" /></label></div>}
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-400"><span>回転 ROTATION</span><span className="font-mono text-sky-200">{shape.rotation > 0 ? '+' : ''}{shape.rotation}°</span></div>
              <input type="range" min={-45} max={45} step={1} value={shape.rotation} onChange={(e) => setShape((c) => ({ ...c, rotation: Number(e.target.value) }))} className="w-full" style={{ ['--fill' as string]: `${((shape.rotation + 45) / 90) * 100}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {TWIN_MODES.map((mode) => (
                <button key={mode.id} onClick={() => setShape((c) => ({ ...c, twin: mode.id }))} className={`rounded-lg border px-2 py-1.5 text-left ${shape.twin === mode.id ? 'border-sky-300/70 bg-sky-300/10' : 'border-white/5 bg-black/25 hover:border-white/20'}`}>
                  <span className="text-[10px] font-bold text-slate-200">{mode.jp}</span><span className="ml-1 font-mono text-[9px] text-slate-600">{mode.en}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <button onClick={() => setShape((c) => ({ ...c, mirror: !c.mirror }))} className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-[9px] font-bold ${shape.mirror ? 'border-sky-300/60 bg-sky-300/15 text-sky-100' : 'border-white/5 bg-white/[0.03] text-slate-400'}`}><Copy className="h-3 w-3" /> 刃面反転</button>
              <button onClick={() => setShape((c) => ({ ...c, flipX: !c.flipX }))} className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-[9px] font-bold ${shape.flipX ? 'border-sky-300/60 bg-sky-300/15 text-sky-100' : 'border-white/5 bg-white/[0.03] text-slate-400'}`}><FlipHorizontal2 className="h-3 w-3" /> 水平</button>
              <button onClick={() => setShape((c) => ({ ...c, flipY: !c.flipY }))} className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-[9px] font-bold ${shape.flipY ? 'border-sky-300/60 bg-sky-300/15 text-sky-100' : 'border-white/5 bg-white/[0.03] text-slate-400'}`}><FlipVertical2 className="h-3 w-3" /> 垂直</button>
            </div>
            <div className="mt-2 rounded-xl border border-white/5 bg-black/25 p-2.5">
              <label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold text-slate-300"><input type="checkbox" checked={shape.autoFit} onChange={(e) => setShape((c) => ({ ...c, autoFit: e.target.checked }))} className="accent-sky-400" /><Scan className="h-3.5 w-3.5 text-sky-300" /> 全体を安全領域へ自動フィット</label>
              <div className="mt-2 flex items-center gap-2"><span className="text-[9px] text-slate-600">SAFE PADDING</span><input type="range" min={0} max={12} step={1} value={shape.fitPadding} onChange={(e) => setShape((c) => ({ ...c, fitPadding: Number(e.target.value) }))} className="flex-1" style={{ ['--fill' as string]: `${(shape.fitPadding / 12) * 100}%` }} /><span className="font-mono text-[9px] text-sky-200">{shape.fitPadding}px</span></div>
              <div className="mt-2 flex justify-between text-[9px]"><span className="text-slate-600">CONTENT {renderMetrics?.bounds ? `${renderMetrics.bounds.width}×${renderMetrics.bounds.height}` : '—'} / {((renderMetrics?.coverage ?? 0) * 100).toFixed(0)}%</span><span className={renderMetrics?.edgePixels ? 'text-red-300' : 'text-emerald-300'}>{renderMetrics?.edgePixels ? `EDGE ${renderMetrics.edgePixels}px` : 'NO CLIP'}</span></div>
            </div>
          </div>

          <DecorationPanel
            shape={shape}
            setShape={setShape}
            selected={selectedDecor}
            onSelect={setSelectedDecor}
            onFocusCanvasTool={() => { setTool('moveDecor'); showToast('装飾移動ツール: キャンバスをドラッグ / 矢印キー'); }}
          />

          <div className="rounded-2xl border border-violet-300/25 bg-[#0e1328]/90 p-4 backdrop-blur">
            <p className="flex items-center gap-1.5 text-[13px] font-black text-white"><Waves className="h-4 w-4 text-violet-300" /> 完全不定形 AMORPHOUS</p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">単なる肉塊ではなく、武器の芯・柄・破損鍔を残しつつ非対称の刃面、負の空間、分岐刃、浮遊片を鍛造します。1.00でも武器として読める「制御された混沌」です。</p>
            <div className="mt-3">
              <EssenceSlider label="MORPH" jp="崩壊度" value={shape.amorphous} onChange={(v) => setShape((c) => ({ ...c, amorphous: v }))} />
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {[0, 0.25, 0.6, 1].map((v) => (
                <button key={v} onClick={() => setShape((c) => ({ ...c, amorphous: v }))} className={`rounded-lg py-1 text-[10px] font-bold ${Math.abs(shape.amorphous - v) < 0.01 ? 'bg-violet-300/20 text-violet-100' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{v.toFixed(2)}</button>
              ))}
            </div>
            <button onClick={() => { setShape((c) => ({ ...c, form: 'amorphous' })); setSeed(Math.floor(Math.random() * 99999999)); showToast('不定形武器を新規生成'); }} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-300/30 bg-violet-400/10 py-2 text-[11px] font-black text-violet-100 hover:bg-violet-400/20">
              <Dices className="h-3.5 w-3.5" /> 混沌鍛造をガチャ生成
            </button>
          </div>

          <div className="rounded-2xl border border-orange-300/25 bg-[#0e1328]/90 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[13px] font-black text-white"><Zap className="h-4 w-4 text-orange-300" /> ELEMENTAL CORE</p>
              <span className="font-mono text-[10px]" style={{ color: ELEMENTS.find((e) => e.id === shape.element)?.color }}>{shape.element.toUpperCase()}</span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">色替えだけでなく、属性ごとの亀裂・血管・稲妻・滴・氷柱を本体ピクセルと輪郭に直接生成します。</p>
            <p className="mt-3 text-[9px] font-black tracking-widest text-slate-600">PRIMARY ELEMENT</p>
            <div className="mt-1.5 grid grid-cols-5 gap-1.5">
              {ELEMENTS.map((element) => {
                const Icon = CATALOG_ICONS[element.icon] ?? CircleDot;
                return <button key={element.id} title={`${element.jp} · ${element.en}`} onClick={() => setShape((c) => ({ ...c, element: element.id }))} className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-lg border p-1 ${shape.element === element.id ? 'border-white/40 bg-white/10' : 'border-white/5 bg-black/25 hover:border-white/20'}`}>
                  <Icon className="h-4 w-4" style={{ color: element.color }} />
                  <span className="text-[9px] font-bold text-slate-300">{element.jp}</span>
                </button>;
              })}
            </div>
            <div className="mt-3">
              <EssenceSlider label="POWER" jp="属性出力" value={shape.elementPower} onChange={(v) => setShape((c) => ({ ...c, elementPower: v }))} />
            </div>
            <div className="mt-3 rounded-xl border border-white/5 bg-black/25 p-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black tracking-widest text-slate-500">SECONDARY</span>
                <select value={shape.elementSecondary} onChange={(e) => setShape((c) => ({ ...c, elementSecondary: e.target.value as ElementMode }))} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-[10px] text-white">
                  {ELEMENTS.map((element) => <option key={element.id} value={element.id}>{element.jp} · {element.en}</option>)}
                </select>
              </div>
              {shape.elementSecondary !== 'none' && <>
                <div className="mt-2 grid grid-cols-4 gap-1">
                  {(['split', 'gradient', 'weave', 'chaos'] as const).map((merge) => <button key={merge} onClick={() => setShape((c) => ({ ...c, elementMerge: merge }))} className={`rounded py-1 font-mono text-[8px] ${shape.elementMerge === merge ? 'bg-orange-300/20 text-orange-100' : 'bg-white/5 text-slate-600'}`}>{merge}</button>)}
                </div>
                <div className="mt-2"><EssenceSlider label="MERGE" jp="融合比率" value={shape.elementBlend} onChange={(v) => setShape((c) => ({ ...c, elementBlend: v }))} /></div>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full"><span style={{ width: `${(1 - shape.elementBlend) * 100}%`, background: ELEMENTS.find((e) => e.id === shape.element)?.color }} /><span style={{ width: `${shape.elementBlend * 100}%`, background: ELEMENTS.find((e) => e.id === shape.elementSecondary)?.color }} /></div>
              </>}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0e1328]/90 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[13px] font-black text-white"><Save className="h-4 w-4 text-amber-300" /> BLUEPRINT VAULT</p>
              <span className="font-mono text-[10px] text-slate-600">LOCAL {blueprints.length}/30</span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">形状・装飾・属性・色・アニメーションを1つの設計図として保存。JSONなら別環境へ移植できます。</p>
            <div className="mt-3 flex gap-1.5">
              <input value={blueprintName} onChange={(e) => setBlueprintName(e.target.value)} maxLength={48} placeholder="設計図名" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-white outline-none focus:border-amber-300/50" />
              <button onClick={saveBlueprint} title="ローカル保存" className="rounded-lg bg-amber-300 p-2 text-black hover:bg-amber-200"><Save className="h-3.5 w-3.5" /></button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <button onClick={downloadBlueprint} className="flex items-center justify-center gap-1 rounded-lg bg-white/5 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-white/10"><Download className="h-3 w-3" /> JSON</button>
              <button onClick={() => blueprintFileRef.current?.click()} className="flex items-center justify-center gap-1 rounded-lg bg-white/5 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-white/10"><Upload className="h-3 w-3" /> 読込</button>
              <button onClick={downloadBatch} className="flex items-center justify-center gap-1 rounded-lg bg-fuchsia-400/10 py-1.5 text-[10px] font-bold text-fuchsia-200 hover:bg-fuchsia-400/20"><Shuffle className="h-3 w-3" /> 12種量産</button>
              <input ref={blueprintFileRef} type="file" accept=".json,.skyforge.json,application/json" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void importBlueprint(file); e.currentTarget.value = ''; }} />
            </div>
            {blueprints.length > 0 && (
              <div className="mt-3 max-h-44 space-y-1 overflow-y-auto border-t border-white/5 pt-2">
                {blueprints.slice(0, 12).map((blueprint) => (
                  <div key={blueprint.id} className="group flex items-center gap-2 rounded-lg bg-black/25 p-1.5">
                    <button onClick={() => applyBlueprint(blueprint)} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-[10px] font-bold text-slate-200">{blueprint.name}</span>
                      <span className="block truncate font-mono text-[9px] text-slate-600">{blueprint.shape.form} · {blueprint.shape.element ?? 'none'} · #{String(blueprint.seed).slice(-6)}</span>
                    </button>
                    <button onClick={() => setBlueprints((current) => current.filter((entry) => entry.id !== blueprint.id))} title="削除" className="rounded p-1 text-slate-700 opacity-50 hover:bg-red-400/10 hover:text-red-300 group-hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-cyan-300/20 bg-[#0e1328]/90 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[13px] font-black text-white"><SlidersHorizontal className="h-4 w-4 text-cyan-300" /> STYLE ESSENCE</p>
              <button onClick={() => setEssence((current) => ({ ...current, mix: { ...DEFAULT_TEXTURE_ESSENCE.mix } }))} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-cyan-200"><RotateCcw className="h-3 w-3" /> MIX RESET</button>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">4つの画風を大胆に分離しました。FurfSkyは太い輪郭と高彩度、Vanilla+は簡潔、ImperiaLは硬い金属光、Faithfulは細密ディザへ強く振れます。</p>
            <div className="mt-3 grid grid-cols-4 gap-1">
              {([
                ['furfsky', 'FURF', 'bg-fuchsia-400/15 text-fuchsia-200'], ['vanilla', 'VANILLA', 'bg-emerald-400/15 text-emerald-200'],
                ['imperial', 'IMPERIAL', 'bg-amber-300/15 text-amber-200'], ['faithful', 'FAITHFUL', 'bg-sky-300/15 text-sky-200'],
              ] as const).map(([key, label, cls]) => <button key={key} onClick={() => setEssence((current) => ({ ...current, mix: { furfsky: key === 'furfsky' ? 1 : 0, vanilla: key === 'vanilla' ? 1 : 0, imperial: key === 'imperial' ? 1 : 0, faithful: key === 'faithful' ? 1 : 0 } }))} className={`rounded py-1 font-mono text-[8px] font-bold ${cls}`}>{label}</button>)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              <EssenceSlider label="FurfSky" jp="FurfSky" value={essence.mix.furfsky} onChange={(v) => setMixValue('furfsky', v)} />
              <EssenceSlider label="Vanilla+" jp="Vanilla+" value={essence.mix.vanilla} onChange={(v) => setMixValue('vanilla', v)} />
              <EssenceSlider label="ImperiaL" jp="ImperiaL" value={essence.mix.imperial} onChange={(v) => setMixValue('imperial', v)} />
              <EssenceSlider label="Faithful" jp="Faithful" value={essence.mix.faithful} onChange={(v) => setMixValue('faithful', v)} />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-black/30 px-2.5 py-2">
              <span className="text-[10px] text-slate-500">INPUT MIX <b className={Math.abs(mixSum - 1) < 0.01 ? 'text-emerald-300' : 'text-amber-300'}>{Math.round(mixSum * 100)}%</b> / RENDER NORMALIZED</span>
              <button onClick={normalizePackMix} className="text-[10px] font-bold text-cyan-300 hover:text-white">合計を100%にする</button>
            </div>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/5" aria-label="Style mix composition">
              <div className="bg-fuchsia-400 transition-all" style={{ width: mixWidth(essence.mix.furfsky) }} />
              <div className="bg-emerald-400 transition-all" style={{ width: mixWidth(essence.mix.vanilla) }} />
              <div className="bg-amber-300 transition-all" style={{ width: mixWidth(essence.mix.imperial) }} />
              <div className="bg-sky-300 transition-all" style={{ width: mixWidth(essence.mix.faithful) }} />
            </div>
            <div className="mt-3"><EssenceSlider label="INFLUENCE" jp="画風の効き" value={essence.stylePower} max={2} onChange={(v) => setEssenceValue('stylePower', v)} /></div>
          </div>

          <div className="rounded-2xl border border-fuchsia-300/20 bg-[#0e1328]/90 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[13px] font-black text-white"><Cuboid className="h-4 w-4 text-fuchsia-300" /> ITEM型 ESSENCE MIX</p>
              <button onClick={() => setEssence((current) => ({ ...current, silhouette: DEFAULT_TEXTURE_ESSENCE.silhouette, outline: DEFAULT_TEXTURE_ESSENCE.outline, saturation: DEFAULT_TEXTURE_ESSENCE.saturation, contrast: DEFAULT_TEXTURE_ESSENCE.contrast, runes: DEFAULT_TEXTURE_ESSENCE.runes, gems: DEFAULT_TEXTURE_ESSENCE.gems, wear: DEFAULT_TEXTURE_ESSENCE.wear, glow: DEFAULT_TEXTURE_ESSENCE.glow }))} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-fuchsia-200"><RotateCcw className="h-3 w-3" /> RESET</button>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">このアイテムの形・表面ディテールを直接変形。0.00で無効、1.00で基準量、2.00で強調。</p>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              <EssenceSlider label="SHAPE" jp="固有シルエット" value={essence.silhouette} onChange={(v) => setEssenceValue('silhouette', v)} />
              <EssenceSlider label="OUTLINE" jp="アウトライン" value={essence.outline} onChange={(v) => setEssenceValue('outline', v)} max={2} />
              <EssenceSlider label="SATURATION" jp="彩度" value={essence.saturation} onChange={(v) => setEssenceValue('saturation', v)} max={2} />
              <EssenceSlider label="CONTRAST" jp="コントラスト" value={essence.contrast} onChange={(v) => setEssenceValue('contrast', v)} max={2} />
              <EssenceSlider label="RUNE" jp="ルーン" value={essence.runes} onChange={(v) => setEssenceValue('runes', v)} />
              <EssenceSlider label="GEM" jp="ジェム" value={essence.gems} onChange={(v) => setEssenceValue('gems', v)} />
              <EssenceSlider label="WEAR" jp="摩耗" value={essence.wear} onChange={(v) => setEssenceValue('wear', v)} />
              <EssenceSlider label="GLOW" jp="発光" value={essence.glow} onChange={(v) => setEssenceValue('glow', v)} />
            </div>
            <p className="mt-3 border-t border-white/5 pt-2 text-[10px] text-slate-600">GEN: silhouette {essence.silhouette.toFixed(2)} / outline ×{essence.outline.toFixed(2)} / gem ×{essence.gems.toFixed(2)}</p>
          </div>

          <div className="rounded-2xl border border-amber-300/20 bg-[#0e1328]/90 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[13px] font-black text-white"><Sparkles className="h-4 w-4 text-amber-300" /> ANIMATION</p>
              <span className="font-mono text-[10px] text-slate-500">FRAME {animationMode === 'none' ? '—' : `${animationFrame + 1}/${animationFrames}`}</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {ANIMATION_DEFS.map((anim) => {
                const Icon = CATALOG_ICONS[anim.icon] ?? Sparkles;
                return <button key={anim.id} onClick={() => setAnimationMode(anim.id)} title={anim.jp} className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg border px-1 py-1.5 transition-colors ${animationMode === anim.id ? 'border-amber-300/70 bg-amber-300/10 text-amber-200' : 'border-white/5 bg-black/25 text-slate-500 hover:border-white/20 hover:text-slate-200'}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-bold">{anim.en}</span>
                </button>;
              })}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-black/30 p-2.5">
              <Slider label="FRAMES" jp="フレーム数" value={animationFrames} min={2} max={16} onChange={setAnimationFrames} />
              <Slider label="TICKS / FRAME" jp="フレーム時間" value={frameTime} min={1} max={20} onChange={setFrameTime} />
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-600"><Clock3 className="h-3 w-3" /> Minecraft準拠: 1 tick = 50ms。選択中の効果はライブプレビューと縦積みアニメーション書き出しに反映。</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0e1328]/80 p-4 backdrop-blur">
            <p className="flex items-center gap-1.5 text-[13px] font-black text-white"><Sparkles className="h-4 w-4 text-amber-400" /> STYLE DNA — エッセンス配合</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">各Skyblockパックの画風を分解・再配合。著作物ではなく<b className="text-slate-300">画風の特徴量</b>として独自に再実装しています。</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => applyPreset(p.id)} className={`rounded-xl border p-2.5 text-left transition-all ${presetId === p.id ? 'border-amber-400/70 bg-amber-400/10 shadow-[0_0_18px_rgba(245,197,66,.15)]' : 'border-white/10 bg-white/[0.02] hover:border-white/25'}`}>
                  <span className="text-[10px] font-bold text-fuchsia-300">{p.tag}</span>
                  <span className="block text-[13px] font-black text-white">{p.jp}</span>
                  <span className="block font-mono text-[10px] text-slate-500">{p.name}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 rounded-xl bg-black/30 p-2.5 text-[11px] leading-relaxed text-slate-400">{preset.desc}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0e1328]/80 p-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-black text-white">微調整スライダー</p>
              <button onClick={() => { setStyle({ ...preset.style }); showToast('スライダーをリセット'); }} className="text-[11px] font-bold text-slate-500 hover:text-amber-300">リセット</button>
            </div>
            <div className="space-y-3">
              <Slider label="OUTLINE" jp="輪郭線" value={style.outline} onChange={(v) => setS('outline', v)} max={100} />
              <Slider label="SOFTNESS" jp="柔らかさ" value={style.softness} onChange={(v) => setS('softness', v)} max={100} />
              <Slider label="SATURATION" jp="彩度" value={style.saturation} onChange={(v) => setS('saturation', v)} max={200} />
              <Slider label="CONTRAST" jp="明暗差" value={style.contrast} onChange={(v) => setS('contrast', v)} max={100} />
              <Slider label="HIGHLIGHT" jp="照り返し" value={style.highlight} onChange={(v) => setS('highlight', v)} max={100} />
              <Slider label="GRAIN" jp="質感ノイズ" value={style.grain} onChange={(v) => setS('grain', v)} max={100} />
              <Slider label="BEVEL" jp="立体ベベル" value={style.bevel} onChange={(v) => setS('bevel', v)} max={100} />
              <Slider label="CEL" jp="アニメ塗り" value={style.cartoon} onChange={(v) => setS('cartoon', v)} max={100} />
              <Slider label="GLOW" jp="発光" value={style.glow} onChange={(v) => setS('glow', v)} max={100} />
              <Slider label="EDGE LIGHT" jp="縁の反射" value={style.edgeLight} onChange={(v) => setS('edgeLight', v)} max={100} />
              <Slider label="DITHER" jp="ディザ密度" value={style.dither} onChange={(v) => setS('dither', v)} max={100} />
              <Slider label="HUE SHIFT" jp="影の色相差" value={style.hueShift} onChange={(v) => setS('hueShift', v)} max={100} />
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/30 p-2">
              <span className="text-[11px] font-bold text-slate-400">SEED</span>
              <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1 font-mono text-[12px] text-amber-300 outline-none focus:border-amber-400/60" />
              <button onClick={randomize} className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-amber-400 hover:text-black"><Dices className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0e1328]/80 p-4 backdrop-blur">
            <p className="flex items-center gap-1.5 text-[13px] font-black text-white"><Info className="h-4 w-4 text-cyan-300" /> 取り込んだエッセンス（独自解釈）</p>
            <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-slate-400">
              {[
                ['per-pixel サンプリング描画', 'ベクター描画を使わず、64座標系の形状関数を1ドットずつ評価。どの解像度でもアンチエイリアスの滲みが出ない真のドット絵。'],
                ['5階調カラーランプ＋色相シフト', '影は寒色へ、光は暖色へ寄せた5段ランプに量子化。FurfSky系の「塗り絵のような」明快な陰影の正体。'],
                ['解像度比例の輪郭ダイレーション', 'シルエット外周を距離変換で太らせる。16px=1px、64px=4px と比例させ、どの解像度でも同じ視覚的重さを保つ。'],
                ['モードフィルタ・スーパーサンプル', '16pxは4×4、32pxは3×3で評価し最頻色を採用。縮小で色が濁らず、各解像度が独立した完成品になる。'],
                ['解像度連動ディテール', 'ルーン宝石・柄の組紐・兜のリベット・刃の傷は64pxでのみ描画。16pxでは自動的に省略して潰れを防ぐ。'],
              ].map(([t, d]) => (
                <li key={t} className="rounded-xl bg-black/30 p-2.5">
                  <span className="flex items-center gap-1 font-bold text-slate-200"><ChevronRight className="h-3 w-3 text-amber-400" />{t}</span>
                  <span className="mt-0.5 block">{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-black text-slate-300"><Swords className="h-4 w-4 text-slate-500" /> 使い方</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[11px] leading-relaxed text-slate-500">
              <li>左から武器・防具を選ぶ（全{ITEMS.length}種）</li>
              <li>右のSTYLE DNAで画風を配合する</li>
              <li>中央キャンバスでドットを直接修正する</li>
              <li>解像度を16/32/64で切り替え、右下から書き出す</li>
            </ol>
            <p className="mt-2 flex items-start gap-1 text-[10px] leading-relaxed text-slate-600"><Shirt className="mt-0.5 h-3 w-3 shrink-0" /> 本ツールはHypixel・各パック作者とは無関係のファンメイド・ジェネレーターです。生成物はオリジナルであり、既存パックの複製ではありません。<Gem className="mt-0.5 h-3 w-3 shrink-0" /></p>
          </div>
        </aside>
      </main>

      <footer className="border-t border-white/10 bg-black/40 py-6">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 text-[11px] text-slate-500">
          <span className="font-pixel text-slate-300">SKYBLOCK TEXTURE ATELIER</span>
          <span>— 64×64 NATIVE ENGINE ・ FurfSky / Vanilla+ / Faithful / Ragnarok / SkyPixel / Overhaul の画風特徴量を独自に再構成</span>
          <span className="ml-auto font-mono">SEED {seed} ・ {item.name} ・ {preset.name} ・ {resolution}x</span>
        </div>
      </footer>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-amber-400/40 bg-black/90 px-4 py-2.5 text-[12px] font-bold text-amber-300 shadow-[0_0_30px_rgba(245,197,66,.3)] backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  );
}
