import { useEffect, useRef, useState, useCallback } from "react";
import { PALETTES, pixelate, type Opts, type RGB } from "./pixel";
import { SAMPLE_IMAGES } from "./sampleImages";
import { TEXTURE_TARGETS, type TextureTarget } from "./minecraftExport";
import { BlockPreview3D } from "./BlockPreview3D";
import { SeamlessTilingPreview } from "./SeamlessTilingPreview";
import { MinecraftPackExportPanel } from "./MinecraftPackModal";
import {
  Upload,
  Download,
  Grid as GridIcon,
  Layers,
  Box,
  Palette,
  Sliders,
  Sparkles,
  PackageCheck,
  Check,
  Copy,
  Info,
} from "lucide-react";

export default function App() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [o, setO] = useState<Opts>({
    size: 16, // Default to Minecraft standard 16x16!
    aspectMode: "square-crop",
    colors: 16,
    palette: "自動 (k-means)",
    dither: "none",
    contrast: 15,
    brightness: 0,
    saturation: 115,
    mcNoise: 15, // slight Minecraft texture noise
    outline: false,
    sharpness: false,
  });

  const [activeTab, setActiveTab] = useState<"2d" | "3d" | "tiling" | "export">("2d");
  const [showGrid, setShowGrid] = useState(true);
  const [exportScale, setExportScale] = useState(16);
  const [usedPalette, setUsedPalette] = useState<RGB[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<TextureTarget>(TEXTURE_TARGETS[0]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const rawPixelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const setOpt = <K extends keyof Opts>(key: K, val: Opts[K]) => {
    setO((prev) => ({ ...prev, [key]: val }));
  };

  // Load image from File
  const handleLoadFile = useCallback((file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const i = new Image();
      i.onload = () => setImg(i);
      i.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  // Load sample image
  const handleLoadSample = (dataUrl: string) => {
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = dataUrl;
  };

  // Default load first sample image on mount
  useEffect(() => {
    handleLoadSample(SAMPLE_IMAGES[0].dataUrl);
  }, []);

  // Clipboard paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) handleLoadFile(file);
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleLoadFile]);

  // Pixelate processing trigger
  useEffect(() => {
    if (!img) return;

    const timer = setTimeout(() => {
      const { canvas, palette } = pixelate(img, o);
      rawPixelCanvasRef.current = canvas;
      setUsedPalette(palette);

      // Render upscale to display canvas
      if (displayCanvasRef.current) {
        const dest = displayCanvasRef.current;
        const targetDisplaySize = 480;
        const multiplier = Math.max(1, Math.floor(targetDisplaySize / Math.max(canvas.width, canvas.height)));

        dest.width = canvas.width * multiplier;
        dest.height = canvas.height * multiplier;
        const ctx = dest.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, dest.width, dest.height);
        ctx.drawImage(canvas, 0, 0, dest.width, dest.height);

        // Pixel grid lines
        if (showGrid && multiplier >= 4) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let x = 0; x <= canvas.width; x++) {
            ctx.moveTo(x * multiplier + 0.5, 0);
            ctx.lineTo(x * multiplier + 0.5, dest.height);
          }
          for (let y = 0; y <= canvas.height; y++) {
            ctx.moveTo(0, y * multiplier + 0.5);
            ctx.lineTo(dest.width, y * multiplier + 0.5);
          }
          ctx.stroke();
        }
      }
    }, 40);

    return () => clearTimeout(timer);
  }, [img, o, showGrid]);

  // Export single PNG
  const handleDownloadSinglePng = () => {
    const raw = rawPixelCanvasRef.current;
    if (!raw) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = raw.width * exportScale;
    exportCanvas.height = raw.height * exportScale;
    const ctx = exportCanvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(raw, 0, 0, exportCanvas.width, exportCanvas.height);

    const a = document.createElement("a");
    const suffix = exportScale === 1 ? "_native" : `_x${exportScale}`;
    a.download = `pixel_${selectedTarget.id}_${raw.width}x${raw.height}${suffix}.png`;
    a.href = exportCanvas.toDataURL("image/png");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyHex = (c: RGB) => {
    const hex = "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div
      className="min-h-screen bg-[#111019] text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black"
      style={{ fontFamily: "'DotGothic16', system-ui, sans-serif" }}
    >
      {/* App Header */}
      <header className="px-6 py-4 bg-[#181624] border-b border-white/10 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xl">
        <div className="flex items-center gap-3">
          {/* Minecraft Pixel Icon Art */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 via-teal-700 to-green-900 p-1 flex items-center justify-center shadow-lg shadow-emerald-950/60 border border-emerald-400/40">
            <Box className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider text-white">
                PIXEL CRAFT
              </h1>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-sans font-semibold">
                Minecraft テクスチャ工房
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              画像を16〜128pxのドット絵へ変換 ＆ 3Dプレビュー＆マイクラリソースパック (.zip / .mcpack) 一発生成
            </p>
          </div>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-400 hidden md:inline">サンプル画像:</span>
          <div className="flex items-center gap-1.5">
            {SAMPLE_IMAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => handleLoadSample(s.dataUrl)}
                className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 transition flex items-center gap-1.5"
                title={`${s.name} (${s.category})`}
              >
                <img src={s.dataUrl} className="w-4 h-4 rounded-sm pixelated" alt={s.name} />
                <span className="hidden lg:inline">{s.name}</span>
              </button>
            ))}
          </div>

          <label className="cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs shadow-md transition ml-2">
            <Upload className="w-4 h-4" />
            <span>画像を読み込む</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLoadFile(e.target.files?.[0])}
            />
          </label>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 lg:p-6 grid lg:grid-cols-[340px_1fr] gap-6">
        {/* Left Sidebar: Settings & Controls */}
        <aside className="space-y-5 bg-[#171622] rounded-2xl p-5 border border-white/10 h-fit shadow-2xl">
          {/* Section: Size & Minecraft Aspect */}
          <div className="space-y-3 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" /> 解像度 (サイズ)
              </label>
              <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded">
                {o.size} × {o.size} px
              </span>
            </div>

            <input
              type="range"
              min={16}
              max={128}
              step={1}
              value={o.size}
              onChange={(e) => setOpt("size", +e.target.value)}
              className="w-full accent-emerald-500 cursor-pointer"
            />

            {/* Quick Resolution Buttons */}
            <div className="grid grid-cols-6 gap-1">
              {[16, 32, 48, 64, 96, 128].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setOpt("size", sz)}
                  className={`py-1 text-xs rounded transition font-mono ${
                    o.size === sz
                      ? "bg-emerald-500 text-black font-bold shadow-sm shadow-emerald-500/50"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  }`}
                  title={sz === 16 ? "Minecraft標準 16x16" : sz === 32 ? "高解像度 32x32" : `${sz}px`}
                >
                  {sz}
                  {sz === 16 && <span className="block text-[9px] text-emerald-950 -mt-1 font-sans">バニラ</span>}
                </button>
              ))}
            </div>

            {/* Aspect Mode */}
            <div className="pt-2">
              <label className="block text-xs text-zinc-400 mb-1.5">
                アスペクト比 / トリミング
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  onClick={() => setOpt("aspectMode", "square-crop")}
                  className={`py-1.5 px-2 rounded-lg border transition text-left ${
                    o.aspectMode === "square-crop"
                      ? "bg-emerald-600/30 border-emerald-500 text-emerald-200 font-semibold"
                      : "bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  正方形クロップ (1:1)
                  <span className="block text-[10px] text-zinc-500 font-normal">ブロック推奨・中央切り抜き</span>
                </button>
                <button
                  onClick={() => setOpt("aspectMode", "square-fit")}
                  className={`py-1.5 px-2 rounded-lg border transition text-left ${
                    o.aspectMode === "square-fit"
                      ? "bg-emerald-600/30 border-emerald-500 text-emerald-200 font-semibold"
                      : "bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  正方形フィット (1:1)
                  <span className="block text-[10px] text-zinc-500 font-normal">アイテム推奨・余白透過</span>
                </button>
                <button
                  onClick={() => setOpt("aspectMode", "stretch")}
                  className={`py-1.5 px-2 rounded-lg border transition text-left ${
                    o.aspectMode === "stretch"
                      ? "bg-emerald-600/30 border-emerald-500 text-emerald-200 font-semibold"
                      : "bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  引き伸ばし (1:1)
                  <span className="block text-[10px] text-zinc-500 font-normal">正方形に伸縮</span>
                </button>
                <button
                  onClick={() => setOpt("aspectMode", "original")}
                  className={`py-1.5 px-2 rounded-lg border transition text-left ${
                    o.aspectMode === "original"
                      ? "bg-emerald-600/30 border-emerald-500 text-emerald-200 font-semibold"
                      : "bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  元画像比率
                  <span className="block text-[10px] text-zinc-500 font-normal">縦横比を維持</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section: Palette & Color Quantization */}
          <div className="space-y-3 pb-4 border-b border-white/10">
            <label className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-emerald-400" /> カラーパレット
            </label>

            <select
              value={o.palette}
              onChange={(e) => setOpt("palette", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {Object.keys(PALETTES).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {o.palette === "自動 (k-means)" && (
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>減色カラー数 (k-means)</span>
                  <span className="text-emerald-400 font-mono font-bold">{o.colors} 色</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={48}
                  value={o.colors}
                  onChange={(e) => setOpt("colors", +e.target.value)}
                  className="w-full accent-emerald-500"
                />
              </div>
            )}

            {/* Dither mode */}
            <div>
              <span className="block text-xs text-zinc-400 mb-1.5">ディザリング (グラデーション)</span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  ["none", "なし"],
                  ["bayer", "Bayer"],
                  ["fs", "誤差拡散"],
                  ["noise", "ノイズ"],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setOpt("dither", v as Opts["dither"])}
                    className={`py-1.5 rounded-lg text-xs transition ${
                      o.dither === v
                        ? "bg-emerald-500 text-black font-bold"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Adjustments & Minecraft Grain Noise */}
          <div className="space-y-3 pb-4 border-b border-white/10">
            <span className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" /> 質感・色調の微調整
            </span>

            {/* Minecraft Texture Noise */}
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                  🧱 マイクラ風テクスチャノイズ
                </span>
                <span className="text-emerald-400 font-mono font-bold">{o.mcNoise}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={o.mcNoise}
                onChange={(e) => setOpt("mcNoise", +e.target.value)}
                className="w-full accent-emerald-500"
              />
              <p className="text-[10px] text-zinc-500 mt-0.5">
                ブロック表面に石や土のような微細なザラつき質感を加えます
              </p>
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>コントラスト</span>
                <span className="text-zinc-200 font-mono">{o.contrast > 0 ? `+${o.contrast}` : o.contrast}</span>
              </div>
              <input
                type="range"
                min={-60}
                max={80}
                value={o.contrast}
                onChange={(e) => setOpt("contrast", +e.target.value)}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>彩度</span>
                <span className="text-zinc-200 font-mono">{o.saturation}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={o.saturation}
                onChange={(e) => setOpt("saturation", +e.target.value)}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Brightness */}
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>明度</span>
                <span className="text-zinc-200 font-mono">{o.brightness > 0 ? `+${o.brightness}` : o.brightness}</span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                value={o.brightness}
                onChange={(e) => setOpt("brightness", +e.target.value)}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Outline */}
            <label className="flex items-center justify-between text-xs text-zinc-300 pt-1 cursor-pointer">
              <span>輪郭線を付与 (透過アイテム・剣向け)</span>
              <input
                type="checkbox"
                checked={o.outline}
                onChange={(e) => setOpt("outline", e.target.checked)}
                className="accent-emerald-500 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          {/* Section: Single PNG Export */}
          <div className="space-y-3">
            <span className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-400" /> 単体PNGダウンロード
            </span>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">書き出し倍率:</span>
              <div className="flex gap-1">
                {[1, 2, 4, 8, 16, 32].map((m) => (
                  <button
                    key={m}
                    onClick={() => setExportScale(m)}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition ${
                      exportScale === m
                        ? "bg-emerald-500 text-black font-bold"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    ×{m}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleDownloadSinglePng}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>
                PNGを保存 ({rawPixelCanvasRef.current ? rawPixelCanvasRef.current.width * exportScale : o.size}×
                {rawPixelCanvasRef.current ? rawPixelCanvasRef.current.height * exportScale : o.size}px)
              </span>
            </button>
          </div>
        </aside>

        {/* Right Main Area: Tabs & Viewers */}
        <div className="flex flex-col space-y-4 min-w-0">
          {/* Main Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#171622] p-1.5 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("2d")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  activeTab === "2d"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <GridIcon className="w-4 h-4" /> 2Dドット絵 & 比較
              </button>

              <button
                onClick={() => setActiveTab("3d")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  activeTab === "3d"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Box className="w-4 h-4" /> 3Dブロックプレビュー
              </button>

              <button
                onClick={() => setActiveTab("tiling")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  activeTab === "tiling"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Layers className="w-4 h-4" /> 建築タイリング検証
              </button>

              <button
                onClick={() => setActiveTab("export")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  activeTab === "export"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold shadow-md shadow-emerald-950/50"
                    : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30"
                }`}
              >
                <PackageCheck className="w-4 h-4" /> Minecraftアセット化
              </button>
            </div>

            {/* Quick target selector indicator */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-zinc-400 pr-3">
              <span>置換予定:</span>
              <select
                value={selectedTarget.id}
                onChange={(e) => {
                  const t = TEXTURE_TARGETS.find((target) => target.id === e.target.value);
                  if (t) setSelectedTarget(t);
                }}
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-emerald-300 focus:outline-none"
              >
                {TEXTURE_TARGETS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab 1: 2D Pixel View & Original Comparison */}
          {activeTab === "2d" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleLoadFile(e.dataTransfer.files[0]);
              }}
              className={`flex-1 min-h-[560px] bg-[#171622] rounded-2xl border ${
                isDragOver ? "border-emerald-400 bg-emerald-500/5" : "border-white/10"
              } p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden`}
              style={{
                backgroundImage:
                  "radial-gradient(#252236 1px, transparent 1px), radial-gradient(#252236 1px, #171622 1px)",
                backgroundSize: "24px 24px",
                backgroundPosition: "0 0, 12px 12px",
              }}
            >
              {/* Top View Bar */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-zinc-200">
                    ドット絵キャンバス
                  </span>
                  {rawPixelCanvasRef.current && (
                    <span className="text-xs bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      実寸: {rawPixelCanvasRef.current.width} × {rawPixelCanvasRef.current.height} px
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg hover:border-white/20 transition">
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span>グリッド線を表示</span>
                  </label>

                  <button
                    onClick={() => setActiveTab("3d")}
                    className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white bg-emerald-950/70 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>3Dで見る</span>
                  </button>
                </div>
              </div>

              {/* Center Canvas & Original Preview */}
              <div className="flex-1 flex flex-wrap items-center justify-center gap-8 py-6">
                {/* Original Image Preview */}
                {img && (
                  <div className="flex flex-col items-center">
                    <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-xl max-w-[240px] max-h-[240px]">
                      <img
                        src={img.src}
                        alt="Original"
                        className="object-contain max-w-[240px] max-h-[240px] block"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs text-zinc-200 p-2 text-center">
                        ドラッグ＆ドロップ または Ctrl+V で別の画像を読み込めます
                      </div>
                    </div>
                    <span className="text-xs text-zinc-400 mt-2 font-mono">
                      元画像: {img.naturalWidth} × {img.naturalHeight} px
                    </span>
                  </div>
                )}

                {/* Pixel Art Result Canvas */}
                <div className="flex flex-col items-center">
                  <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl bg-black/60 p-1">
                    <canvas
                      ref={displayCanvasRef}
                      className="block max-w-full max-h-[480px] object-contain rounded"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <span className="text-xs text-emerald-300 mt-2 font-mono flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    変換後: {rawPixelCanvasRef.current ? rawPixelCanvasRef.current.width : o.size} ×{" "}
                    {rawPixelCanvasRef.current ? rawPixelCanvasRef.current.height : o.size} px (ニアレストネイバー)
                  </span>
                </div>
              </div>

              {/* Palette Swatches Bar */}
              {usedPalette.length > 0 && (
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span>使用パレット色 ({usedPalette.length} 色)</span>
                      <span className="text-[11px] text-zinc-500">クリックでHEXカラーコードをコピー</span>
                    </div>
                    {copiedColor && (
                      <span className="text-emerald-400 flex items-center gap-1 text-xs">
                        <Check className="w-3.5 h-3.5" /> {copiedColor} をコピーしました！
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1 bg-black/30 rounded-lg border border-white/5">
                    {usedPalette.map((c, i) => {
                      const hex = "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
                      return (
                        <button
                          key={i}
                          onClick={() => copyHex(c)}
                          title={`${hex} - クリックでコピー`}
                          className="w-6 h-6 rounded border border-white/20 transition transform hover:scale-110 active:scale-95 shadow-sm relative group"
                          style={{ backgroundColor: hex }}
                        >
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-[10px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-10 border border-white/10 flex items-center gap-1">
                            <Copy className="w-2.5 h-2.5" /> {hex}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: 3D Block Preview (Three.js) */}
          {activeTab === "3d" && (
            <div className="flex-1 min-h-[560px]">
              <BlockPreview3D
                canvas={rawPixelCanvasRef.current}
                textureName={selectedTarget.name}
              />
            </div>
          )}

          {/* Tab 3: Seamless Tiling Architecture Simulator */}
          {activeTab === "tiling" && (
            <div className="flex-1 min-h-[560px]">
              <SeamlessTilingPreview canvas={rawPixelCanvasRef.current} />
            </div>
          )}

          {/* Tab 4: Minecraft Resource Pack Export Panel */}
          {activeTab === "export" && (
            <div className="flex-1">
              <MinecraftPackExportPanel
                canvas={rawPixelCanvasRef.current}
                selectedTarget={selectedTarget}
                onSelectTarget={setSelectedTarget}
              />
            </div>
          )}
        </div>
      </main>

      {/* App Footer */}
      <footer className="px-6 py-4 bg-[#14121d] border-t border-white/10 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>PIXEL CRAFT &copy; 2026</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">Minecraft Java Edition & Bedrock Edition テクスチャ生成</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-400">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            16〜128px 可変解像度対応
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            WebGL / Three.js 3Dシミュレーション
          </span>
        </div>
      </footer>
    </div>
  );
}
