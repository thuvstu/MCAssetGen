import { useState } from "react";
import {
  TEXTURE_TARGETS,
  MC_VERSIONS,
  exportMinecraftPack,
  type TextureTarget,
} from "./minecraftExport";
import {
  Download,
  Check,
  Package,
  HelpCircle,
  FileCode,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";

interface MinecraftPackModalProps {
  canvas: HTMLCanvasElement | null;
  selectedTarget: TextureTarget;
  onSelectTarget: (target: TextureTarget) => void;
}

export function MinecraftPackExportPanel({
  canvas,
  selectedTarget,
  onSelectTarget,
}: MinecraftPackModalProps) {
  const [edition, setEdition] = useState<"java" | "bedrock">("java");
  const [packName, setPackName] = useState<string>("MyPixelCraftPack");
  const [packDescription, setPackDescription] = useState<string>("カスタムピクセルアート テクスチャパック");
  const [packFormat, setPackFormat] = useState<number>(34);
  const [selectedIds, setSelectedIds] = useState<string[]>([selectedTarget.id]);
  const [customPath, setCustomPath] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<"all" | "block" | "item" | "painting" | "pack_icon">("block");
  const [isExporting, setIsExporting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [exportedStatus, setExportedStatus] = useState<string | null>(null);

  const toggleTarget = (target: TextureTarget) => {
    setSelectedIds((prev) => {
      if (prev.includes(target.id)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((id) => id !== target.id);
      } else {
        return [...prev, target.id];
      }
    });
    onSelectTarget(target);
  };

  const handleExport = async () => {
    if (!canvas) return;
    setIsExporting(true);
    setExportedStatus(null);
    try {
      const { blob, fileName } = await exportMinecraftPack(canvas, {
        edition,
        packName,
        packDescription,
        targetIds: selectedIds,
        customTargetId: customPath,
        packFormat,
      });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportedStatus(`🎉 「${fileName}」の出力が完了しました！`);
      setTimeout(() => setExportedStatus(null), 6000);
    } catch (err) {
      console.error(err);
      alert("エクスポート中にエラーが発生しました。");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredTargets = TEXTURE_TARGETS.filter(
    (t) => activeCategory === "all" || t.category === activeCategory
  );

  return (
    <div className="bg-[#171622] rounded-xl border border-white/10 p-5 space-y-6 shadow-2xl text-zinc-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-wide text-white">
              Minecraft リソースパック アセット化
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            作成したドット絵を、ゲーム内で即座に使える Java Edition / Bedrock 形式で ZIP / .mcpack 化して出力します。
          </p>
        </div>

        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition"
        >
          <HelpCircle className="w-4 h-4" />
          ゲームへの導入方法
        </button>
      </div>

      {/* Installation Guide Banner (collapsible) */}
      {showGuide && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 text-xs text-zinc-300 space-y-3">
          <div className="flex items-center justify-between font-semibold text-emerald-300 text-sm">
            <span>📖 ゲームへの導入手順</span>
            <button onClick={() => setShowGuide(false)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-black/40 p-3 rounded-lg border border-white/5 space-y-2">
              <div className="font-bold text-amber-400 flex items-center gap-1">
                <ChevronRight className="w-4 h-4" /> Java Edition (PC)
              </div>
              <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                <li>本ツールで「Java Edition (ZIP)」をダウンロードします。</li>
                <li>Minecraftを起動し、<strong>「設定」→「リソースパック」</strong>を開きます。</li>
                <li><strong>「パックフォルダーを開く」</strong>をクリックします。</li>
                <li>開いたフォルダーにダウンロードしたZIPを<strong>解凍せずそのまま</strong>移動します。</li>
                <li>Minecraft画面に戻り、左側の利用可能パックから本パックを有効化（▶）して完了！</li>
              </ol>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-white/5 space-y-2">
              <div className="font-bold text-sky-400 flex items-center gap-1">
                <ChevronRight className="w-4 h-4" /> Bedrock / 統合版 (.mcpack)
              </div>
              <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                <li>本ツールで「統合版 (.mcpack)」をダウンロードします。</li>
                <li>ダウンロードした <code className="bg-white/10 px-1 py-0.5 rounded text-sky-300">.mcpack</code> ファイルをダブルクリック（またはスマホでタップ）します。</li>
                <li>Minecraftが自動起動し、「インポート開始」と表示されます。</li>
                <li>ワールドの「編集」または全般の「グローバルリソース」で有効化すれば適用完了！</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Pack Meta */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> 1. リソースパックの基本設定
          </h3>

          {/* Edition Toggle */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
              対象エディション
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setEdition("java")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-semibold transition ${
                  edition === "java"
                    ? "bg-amber-600/30 border-amber-500 text-amber-200 shadow-md shadow-amber-950/50"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                <span>☕ Java Edition (.zip)</span>
              </button>
              <button
                onClick={() => setEdition("bedrock")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-semibold transition ${
                  edition === "bedrock"
                    ? "bg-sky-600/30 border-sky-500 text-sky-200 shadow-md shadow-sky-950/50"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                <span>🎮 統合版 (.mcpack)</span>
              </button>
            </div>
          </div>

          {/* Pack Name */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium">
              パック名 (表示名)
            </label>
            <input
              type="text"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              placeholder="例: PixelArt_TexturePack"
            />
          </div>

          {/* Pack Description */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium">
              パック説明文 (description)
            </label>
            <input
              type="text"
              value={packDescription}
              onChange={(e) => setPackDescription(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              placeholder="ゲーム内のリソースパック選択画面に表示されます"
            />
          </div>

          {/* Version Format (Java only) */}
          {edition === "java" && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-medium">
                対応Minecraftバージョン (pack_format)
              </label>
              <select
                value={packFormat}
                onChange={(e) => setPackFormat(+e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                {MC_VERSIONS.map((v) => (
                  <option key={v.format} value={v.format}>
                    {v.label} (format {v.format})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Path Override */}
          <div className="pt-2">
            <label className="block text-xs text-zinc-400 mb-1 font-medium flex items-center justify-between">
              <span>カスタムテクスチャパス (任意)</span>
              <span className="text-[11px] text-zinc-500">例: block/ancient_debris</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="block/xxx または item/xxx"
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              ※ リストにない特殊なブロックやアイテム名にも自由に対応できます。
            </p>
          </div>
        </div>

        {/* Right Column: Texture Target Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> 2. 置き換える対象ブロック・アイテム
            </h3>
            <span className="text-xs text-emerald-400 font-mono">
              {selectedIds.length} 個選択中
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setActiveCategory("block")}
              className={`flex-1 py-1 rounded transition ${activeCategory === "block" ? "bg-emerald-600 text-white font-semibold" : "text-zinc-400 hover:text-white"}`}
            >
              ブロック
            </button>
            <button
              onClick={() => setActiveCategory("item")}
              className={`flex-1 py-1 rounded transition ${activeCategory === "item" ? "bg-emerald-600 text-white font-semibold" : "text-zinc-400 hover:text-white"}`}
            >
              アイテム
            </button>
            <button
              onClick={() => setActiveCategory("painting")}
              className={`flex-1 py-1 rounded transition ${activeCategory === "painting" ? "bg-emerald-600 text-white font-semibold" : "text-zinc-400 hover:text-white"}`}
            >
              絵画
            </button>
            <button
              onClick={() => setActiveCategory("all")}
              className={`flex-1 py-1 rounded transition ${activeCategory === "all" ? "bg-emerald-600 text-white font-semibold" : "text-zinc-400 hover:text-white"}`}
            >
              すべて
            </button>
          </div>

          {/* Targets Grid */}
          <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1 border border-white/10 rounded-lg p-2 bg-black/20">
            {filteredTargets.map((t) => {
              const isChecked = selectedIds.includes(t.id);
              return (
                <div
                  key={t.id}
                  onClick={() => toggleTarget(t)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border text-xs ${
                    isChecked
                      ? "bg-emerald-950/50 border-emerald-500/60 text-white"
                      : "bg-white/5 border-transparent text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                        isChecked
                          ? "bg-emerald-500 border-emerald-400 text-black font-bold"
                          : "border-zinc-600 bg-black/40"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="font-medium text-zinc-100 flex items-center gap-1.5">
                        {t.name}
                        <span className="text-[10px] text-zinc-500 font-mono">({t.recommendedSize}×{t.recommendedSize})</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">{t.description}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 bg-black/30 rounded">
                    {t.path}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <span>
              複数選択すると、作成したテクスチャが同時に複数のブロック／アイテムに適用されます。
            </span>
          </div>
        </div>
      </div>

      {/* Export Action Bar */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          {exportedStatus && (
            <div className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-pulse">
              {exportedStatus}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            disabled={!canvas || isExporting}
            onClick={handleExport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/50 transition transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <FileCode className="w-5 h-5 animate-spin" /> パック生成中...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>
                  {edition === "java" ? "Java版 リソースパック (ZIP) を出力" : "統合版 (.mcpack) を出力"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
