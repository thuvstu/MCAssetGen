import { useMemo, useState } from "react";
import {
  Brush, Eraser, PaintBucket, Box, Boxes, Square, Circle, Globe, Database,
  Minus, Pipette, Download, Upload, Trash2, Undo2, Redo2, FileCode,
  Layers, Eye, EyeOff, Grid3x3, RotateCw, X, ArrowLeftRight, Copy, Check,
  ChevronDown, FileBox, Braces, FlipHorizontal, FlipVertical, Package,
  Puzzle, ShieldCheck, Save, FolderOpen, MousePointer2, Clipboard, Scissors, Grid2X2, Paintbrush,
} from "lucide-react";
import type { ToolId, LayerMode } from "./VoxelCanvas";
import { DATA_VERSIONS, getBlock, isRegistered, normalizeBlockId, ID_REGEX } from "../lib/minecraft-data";
import { clipboardNonAir, selectionSize, selectionVolume, type AirMode, type Structure, type BlockStat, type Vec3, type VoxelSelection, type StructureClipboard } from "../lib/structure";
import type { TransformKind, ValidationResult } from "../lib/operations";

interface Props {
  tool: ToolId;
  setTool: (t: ToolId) => void;
  brushSize: number;
  setBrushSize: (n: number) => void;
  structure: Structure;
  stats: { total: number; nonAir: number; stats: BlockStat[] };
  onResize: (x: number, y: number, z: number) => void;
  layerMode: LayerMode;
  setLayerMode: (m: LayerMode) => void;
  layerY: number;
  setLayerY: (n: number) => void;
  showGrid: boolean; setShowGrid: (b: boolean) => void;
  showTransparent: boolean; setShowTransparent: (b: boolean) => void;
  autoRotate: boolean; setAutoRotate: (b: boolean) => void;
  author: string; setAuthor: (s: string) => void;
  dataVersion: number; setDataVersion: (n: number) => void;
  fileName: string; setFileName: (s: string) => void;
  onExport: () => void;
  onImportFile: (f: File) => void;
  onExportMc: () => void;
  mcPreview: string;
  onCopyMc: () => void;
  copiedMc: boolean;
  onClear: () => void;
  onUndo: () => void; onRedo: () => void;
  canUndo: boolean; canRedo: boolean;
  pendingFirst: Vec3 | null;
  onCancelPending: () => void;
  replaceFrom: string;
  setReplaceFrom: (s: string) => void;
  onReplace: () => void;
  lastImport: { paletteSize: number; blockEntries: number; warnings: string[] } | null;
  selectedId: string;
  onTransform: (k: TransformKind) => void;
  onRenameId: (from: string, to: string) => void;
  validation: ValidationResult;
  packNamespace: string; setPackNamespace: (s: string) => void;
  onExportDatapack: () => void;
  onSaveProject: () => void;
  onOpenProject: (f: File) => void;
  onOpenCustom: (id: string | null) => void;
  selection: VoxelSelection | null;
  clipboard: StructureClipboard | null;
  onCopySelection: (cut: boolean) => void;
  onPasteSelection: (origin: Vec3, overwriteAir: boolean, repeats: Vec3, gap: Vec3) => void;
  onFillSelection: () => void;
  onClearSelection: () => void;
  onClearSelectionBox: () => void;
  onOpenLayerEditor: () => void;
  airMode: AirMode; setAirMode: (m: AirMode) => void;
  mirrorX: boolean; setMirrorX: (b: boolean) => void;
  mirrorZ: boolean; setMirrorZ: (b: boolean) => void;
}

const TOOLS: { id: ToolId; ja: string; icon: typeof Brush; hint: string; twoClick?: boolean }[] = [
  { id: "brush", ja: "ブラシ", icon: Brush, hint: "クリック位置に配置" },
  { id: "erase", ja: "消しゴム", icon: Eraser, hint: "クリック位置を削除" },
  { id: "picker", ja: "スポイト", icon: Pipette, hint: "クリックしたブロックを選択" },
  { id: "fill", ja: "塗りつぶし", icon: PaintBucket, hint: "繋がった同種を一括置換" },
  { id: "select", ja: "選択", icon: MousePointer2, hint: "2点クリックで範囲を選択", twoClick: true },
  { id: "box", ja: "直方体", icon: Box, hint: "2点をクリックで範囲を埋める", twoClick: true },
  { id: "hollow", ja: "中空箱", icon: Boxes, hint: "2点で外殻のみ生成", twoClick: true },
  { id: "walls", ja: "壁", icon: Square, hint: "2点で壁(床天井なし)", twoClick: true },
  { id: "sphere", ja: "球体", icon: Circle, hint: "2点の対角で楕円体", twoClick: true },
  { id: "hsphere", ja: "中空球", icon: Globe, hint: "2点で中空の楕円体", twoClick: true },
  { id: "cylinder", ja: "円柱", icon: Database, hint: "2点でY軸の円柱", twoClick: true },
  { id: "line", ja: "直線", icon: Minus, hint: "2点を結ぶ直線", twoClick: true },
];

function Section({ title, icon, children, defaultOpen = true }: { title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-3 py-2 text-left">
        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-zinc-300">
          {icon}
          {title}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && <div className="border-t border-zinc-800/60 px-3 py-2.5">{children}</div>}
    </div>
  );
}

function Toggle({ on, onClick, label, icon }: { on: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] transition ${
        on ? "border-emerald-700 bg-emerald-950/60 text-emerald-200" : "border-zinc-800 bg-zinc-900 text-zinc-500"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

const inputCls =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none";

export default function RightPanel(p: Props) {
  const [tab, setTab] = useState<"tool" | "out" | "stat" | "nbt">("tool");
  const [sizeDraft, setSizeDraft] = useState<[number, number, number]>([...p.structure.size] as [number, number, number]);
  const [mcOpen, setMcOpen] = useState(false);
  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [pastePos, setPastePos] = useState<Vec3>([0, 0, 0]);
  const [repeatCount, setRepeatCount] = useState<Vec3>([1, 1, 1]);
  const [repeatGap, setRepeatGap] = useState<Vec3>([0, 0, 0]);
  const [overwriteAir, setOverwriteAir] = useState(false);

  const paletteSize = useMemo(
    () => 1 + p.stats.stats.reduce((a, s) => a + s.propsVariants, 0),
    [p.stats]
  );
  const maxCount = p.stats.stats[0]?.count ?? 1;
  const activeTool = TOOLS.find((t) => t.id === p.tool)!;
  const renameToNorm = normalizeBlockId(renameTo);
  const renameOk = !!renameFrom && ID_REGEX.test(renameToNorm) && renameToNorm !== renameFrom;
  const v = p.validation;
  const issueCount = v.unregistered.length + v.invalid.length;
  const selSize = p.selection ? selectionSize(p.selection) : null;
  const selVolume = p.selection ? selectionVolume(p.selection) : 0;
  const clipboardBlocks = p.clipboard ? clipboardNonAir(p.clipboard) : 0;

  const setTriplet = (
    setter: (v: Vec3) => void,
    current: Vec3,
    i: number,
    value: number,
    min: number,
    max: number
  ) => {
    const next = [...current] as Vec3;
    next[i] = Math.max(min, Math.min(max, Number.isFinite(value) ? Math.floor(value) : min));
    setter(next);
  };

  return (
    <div className="flex h-full flex-col gap-2">
      {/* タブ */}
      <div className="grid shrink-0 grid-cols-4 gap-1 rounded-lg border border-zinc-800 bg-zinc-950/80 p-1">
        {([
          ["tool", "ツール"],
          ["out", "出力"],
          ["stat", "統計"],
          ["nbt", "NBT"],
        ] as const).map(([id, ja]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative rounded-md py-1.5 text-[11px] font-bold transition ${
              tab === id ? "bg-emerald-600 text-white shadow" : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {ja}
            {id === "out" && issueCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" title="未登録/不正IDあり" />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5 mc-scroll">
        {tab === "tool" && (
          <>
            {/* 履歴 */}
            <div className="flex gap-1.5">
              <button
                onClick={p.onUndo} disabled={!p.canUndo}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 text-[11px] text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-35"
              >
                <Undo2 className="h-3.5 w-3.5" /> 元に戻す
              </button>
              <button
                onClick={p.onRedo} disabled={!p.canRedo}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 text-[11px] text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-35"
              >
                <Redo2 className="h-3.5 w-3.5" /> やり直し
              </button>
            </div>

            {/* 変換 */}
            <Section title="構造の変換" icon={<RotateCw className="h-3.5 w-3.5 text-sky-400" />}>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => p.onTransform("rotY")}
                  className="flex flex-col items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/70 py-2 text-zinc-300 transition hover:border-sky-700 hover:text-sky-200"
                >
                  <RotateCw className="h-4 w-4" />
                  <span className="text-[10px]">Y軸90° (R)</span>
                </button>
                <button
                  onClick={() => p.onTransform("flipX")}
                  className="flex flex-col items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/70 py-2 text-zinc-300 transition hover:border-sky-700 hover:text-sky-200"
                >
                  <FlipHorizontal className="h-4 w-4" />
                  <span className="text-[10px]">X反転 (M)</span>
                </button>
                <button
                  onClick={() => p.onTransform("flipZ")}
                  className="flex flex-col items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/70 py-2 text-zinc-300 transition hover:border-sky-700 hover:text-sky-200"
                >
                  <FlipVertical className="h-4 w-4" />
                  <span className="text-[10px]">Z反転 (N)</span>
                </button>
              </div>
              <div className="mt-2 text-[10px] leading-relaxed text-zinc-600">
                facing / axis / 階段のshape / チェストtype を自動で補正します。MODブロックのステートは同名キーのみ補正されます。
              </div>
            </Section>

            {/* 選択・クリップボード */}
            <Section title="選択・クリップボード" icon={<MousePointer2 className="h-3.5 w-3.5 text-sky-400" />}>
              <div className="rounded-md border border-sky-900/60 bg-sky-950/20 px-2 py-1.5 text-[10px] leading-relaxed text-zinc-400">
                {p.selection && selSize ? (
                  <>
                    <div className="font-mono text-sky-200">
                      [{p.selection.min.join(", ")}] → [{p.selection.max.join(", ")}]
                    </div>
                    <div>
                      size <span className="font-mono text-white">{selSize.join("×")}</span> / {selVolume.toLocaleString()} blocks
                    </div>
                  </>
                ) : (
                  <span>「選択」ツールで始点・終点をクリックして範囲を作成します。</span>
                )}
              </div>

              {p.selection && (
                <>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => p.onCopySelection(false)}
                      className="flex items-center justify-center gap-1 rounded-md bg-sky-700 py-1.5 text-[11px] font-bold text-white hover:bg-sky-600"
                    >
                      <Clipboard className="h-3 w-3" /> コピー
                    </button>
                    <button
                      onClick={() => p.onCopySelection(true)}
                      className="flex items-center justify-center gap-1 rounded-md border border-amber-800 bg-amber-950/40 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-900/50"
                    >
                      <Scissors className="h-3 w-3" /> 切り取り
                    </button>
                    <button
                      onClick={p.onFillSelection}
                      className="flex items-center justify-center gap-1 rounded-md border border-emerald-800 bg-emerald-950/40 py-1.5 text-[11px] font-bold text-emerald-200 hover:bg-emerald-900/50"
                    >
                      <Paintbrush className="h-3 w-3" /> 選択を塗る
                    </button>
                    <button
                      onClick={p.onClearSelection}
                      className="flex items-center justify-center gap-1 rounded-md border border-red-900 bg-red-950/40 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-900/50"
                    >
                      <Eraser className="h-3 w-3" /> 選択を消去
                    </button>
                  </div>
                  <button
                    onClick={p.onClearSelectionBox}
                    className="mt-1.5 w-full text-center text-[10px] text-zinc-500 hover:text-zinc-300"
                  >
                    選択範囲を解除
                  </button>
                </>
              )}

              <div className="mt-2.5 border-t border-zinc-800 pt-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300">貼り付け・反復配置</span>
                  {p.clipboard ? (
                    <span className="font-mono text-[9px] text-sky-300">
                      {p.clipboard.size.join("×")} / {clipboardBlocks} blocks
                    </span>
                  ) : (
                    <span className="text-[9px] text-zinc-600">未コピー</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {(["X", "Y", "Z"] as const).map((axis, i) => (
                    <label key={axis} className="block">
                      <span className="mb-0.5 block font-mono text-[9px] text-zinc-600">貼付 {axis}</span>
                      <input
                        type="number"
                        min={0}
                        max={47}
                        value={pastePos[i]}
                        onChange={(e) => setTriplet(setPastePos, pastePos, i, Number(e.target.value), 0, 47)}
                        className="w-full rounded border border-zinc-700 bg-zinc-900 px-1 py-1 text-center font-mono text-[11px] text-white focus:border-sky-500 focus:outline-none"
                      />
                    </label>
                  ))}
                </div>
                {p.selection && (
                  <button
                    onClick={() => setPastePos([...p.selection!.min] as Vec3)}
                    className="mt-1 w-full rounded bg-zinc-900 py-1 text-[10px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    選択範囲の始点を貼付位置にセット
                  </button>
                )}

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <span className="mb-0.5 block text-[9px] text-zinc-600">反復回数 X / Y / Z</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[0, 1, 2].map((i) => (
                        <input
                          key={i}
                          type="number"
                          min={1}
                          max={8}
                          value={repeatCount[i]}
                          onChange={(e) => setTriplet(setRepeatCount, repeatCount, i, Number(e.target.value), 1, 8)}
                          className="w-full rounded border border-zinc-700 bg-zinc-900 px-1 py-1 text-center font-mono text-[10px] text-white focus:border-sky-500 focus:outline-none"
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[9px] text-zinc-600">間隔 X / Y / Z</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[0, 1, 2].map((i) => (
                        <input
                          key={i}
                          type="number"
                          min={0}
                          max={16}
                          value={repeatGap[i]}
                          onChange={(e) => setTriplet(setRepeatGap, repeatGap, i, Number(e.target.value), 0, 16)}
                          className="w-full rounded border border-zinc-700 bg-zinc-900 px-1 py-1 text-center font-mono text-[10px] text-white focus:border-sky-500 focus:outline-none"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <label className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <input type="checkbox" checked={overwriteAir} onChange={(e) => setOverwriteAir(e.target.checked)} className="accent-sky-500" />
                  空気も上書き（OFFなら非空気ブロックだけを合成）
                </label>
                <button
                  onClick={() => p.onPasteSelection(pastePos, overwriteAir, repeatCount, repeatGap)}
                  disabled={!p.clipboard}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-sky-700 py-1.5 text-[11px] font-bold text-white hover:bg-sky-600 disabled:opacity-35"
                >
                  <Clipboard className="h-3 w-3" /> 貼り付け{repeatCount[0] * repeatCount[1] * repeatCount[2] > 1 ? "・反復" : ""}
                </button>
              </div>

              <button
                onClick={p.onOpenLayerEditor}
                className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-md border border-sky-900 bg-sky-950/30 py-1.5 text-[11px] font-bold text-sky-200 hover:bg-sky-900/40"
              >
                <Grid2X2 className="h-3 w-3" /> 2Dレイヤーエディタを開く
              </button>
            </Section>

            {/* ツールグリッド */}
            <Section title="編集ツール" icon={<Brush className="h-3.5 w-3.5 text-emerald-400" />}>
              <div className="grid grid-cols-4 gap-1.5">
                {TOOLS.map((t) => {
                  const Icon = t.icon;
                  const active = p.tool === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => p.setTool(t.id)}
                      title={t.hint}
                      className={`flex flex-col items-center gap-1 rounded-lg border py-2 transition ${
                        active
                          ? "border-emerald-400 bg-emerald-950/80 text-emerald-200 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                          : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px]">{t.ja}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 rounded-md bg-zinc-900/80 px-2 py-1.5 text-[10px] leading-relaxed text-zinc-400">
                <span className="font-bold text-emerald-300">{activeTool.ja}</span> — {activeTool.hint}
                {activeTool.twoClick && (
                  <span className="mt-0.5 block text-yellow-300/90">
                    {p.pendingFirst
                      ? `始点[${p.pendingFirst.join(",")}]決定済み → 終点をクリック`
                      : "1回目のクリックで始点、2回目で終点"}
                  </span>
                )}
              </div>
              {p.pendingFirst && (
                <button
                  onClick={p.onCancelPending}
                  className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-md border border-yellow-800 bg-yellow-950/40 py-1 text-[11px] text-yellow-300 hover:bg-yellow-900/40"
                >
                  <X className="h-3 w-3" /> 始点を取り消し
                </button>
              )}
              <div className="mt-2.5">
                <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>ブラシサイズ</span>
                  <span className="font-mono text-emerald-300">{p.brushSize}×{p.brushSize}×{p.brushSize}</span>
                </div>
                <input
                  type="range" min={1} max={5} step={2} value={p.brushSize}
                  onChange={(e) => p.setBrushSize(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div className="mt-2.5">
                <div className="mb-1 text-[11px] text-zinc-400">対称配置（ミラー）</div>
                <div className="flex gap-1.5">
                  <Toggle on={p.mirrorX} onClick={() => p.setMirrorX(!p.mirrorX)} label="X軸対称 (X)" icon={<FlipHorizontal className="h-3 w-3" />} />
                  <Toggle on={p.mirrorZ} onClick={() => p.setMirrorZ(!p.mirrorZ)} label="Z軸対称 (Z)" icon={<FlipVertical className="h-3 w-3" />} />
                </div>
                <div className="mt-1 text-[10px] leading-relaxed text-zinc-600">
                  ブラシ・消しゴム・形状・2Dレイヤーに適用。階段の向きや左右の形も鏡像になるよう補正します。
                </div>
              </div>
            </Section>

            {/* 置換 */}
            <Section title="一括置換" icon={<ArrowLeftRight className="h-3.5 w-3.5 text-emerald-400" />} defaultOpen={false}>
              <div className="space-y-1.5">
                <select
                  value={p.replaceFrom}
                  onChange={(e) => p.setReplaceFrom(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-[11px] text-zinc-200"
                >
                  <option value="">置換元を選択…</option>
                  {p.stats.stats.map((s) => (
                    <option key={s.id} value={s.id}>
                      {getBlock(s.id).ja} ({s.count})
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-zinc-500">
                  ↓ 選択中 <span className="font-mono text-emerald-400">{p.selectedId}</span> に置換
                </div>
                <button
                  onClick={p.onReplace}
                  disabled={!p.replaceFrom}
                  className="w-full rounded-md bg-emerald-600 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-500 disabled:opacity-35"
                >
                  置換を実行
                </button>
              </div>
            </Section>

            {/* ID リネーム */}
            <Section title="ID一括リネーム (MOD移行)" icon={<Puzzle className="h-3.5 w-3.5 text-fuchsia-400" />} defaultOpen={false}>
              <div className="space-y-1.5">
                <select
                  value={renameFrom}
                  onChange={(e) => setRenameFrom(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-[11px] text-zinc-200"
                >
                  <option value="">変換元のIDを選択…</option>
                  {p.stats.stats.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id}{isRegistered(s.id) ? "" : "  [未登録]"} ({s.count})
                    </option>
                  ))}
                </select>
                <input
                  value={renameTo}
                  onChange={(e) => setRenameTo(e.target.value)}
                  placeholder="変換先ID 例: mymod:ruby_block"
                  spellCheck={false}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-[11px] text-zinc-200 placeholder:text-zinc-700 focus:border-fuchsia-500 focus:outline-none"
                />
                {renameTo && (
                  <div className="font-mono text-[9px] text-zinc-500">正規化: {renameToNorm || "—"}</div>
                )}
                <button
                  onClick={() => {
                    p.onRenameId(renameFrom, renameToNorm);
                    setRenameFrom("");
                    setRenameTo("");
                  }}
                  disabled={!renameOk}
                  className="w-full rounded-md bg-fuchsia-700 py-1.5 text-[11px] font-bold text-white transition hover:bg-fuchsia-600 disabled:opacity-35"
                >
                  IDを一括変換
                </button>
                <div className="text-[10px] leading-relaxed text-zinc-600">
                  仮IDで作った構造を正式なMOD IDへ差し替えたり、MODのID変更に追従させたりできます（blockstateは保持）。
                </div>
              </div>
            </Section>

            {/* サイズ */}
            <Section title="構造サイズ" icon={<Box className="h-3.5 w-3.5 text-emerald-400" />}>
              <div className="grid grid-cols-3 gap-1.5">
                {(["X", "Y", "Z"] as const).map((axis, i) => (
                  <label key={axis} className="block">
                    <span className="mb-0.5 block text-center font-mono text-[10px] text-zinc-500">{axis}</span>
                    <input
                      type="number" min={1} max={48} value={sizeDraft[i]}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(48, Number(e.target.value) || 1));
                        const n = [...sizeDraft] as [number, number, number];
                        n[i] = val;
                        setSizeDraft(n);
                      }}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-1 py-1 text-center font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-1.5 flex gap-1">
                {[8, 16, 32].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSizeDraft([n, n, n])}
                    className="flex-1 rounded-md border border-zinc-800 bg-zinc-900 py-1 font-mono text-[10px] text-zinc-400 hover:bg-zinc-800"
                  >
                    {n}³
                  </button>
                ))}
                <button
                  onClick={() => p.onResize(sizeDraft[0], sizeDraft[1], sizeDraft[2])}
                  className="flex-[2] rounded-md bg-emerald-600 py-1 text-[11px] font-bold text-white hover:bg-emerald-500"
                >
                  適用
                </button>
              </div>
              <div className="mt-1 text-[10px] text-zinc-600">最大48×48×48（ストラクチャーブロック上限）</div>
            </Section>

            {/* レイヤー */}
            <Section title="レイヤー表示" icon={<Layers className="h-3.5 w-3.5 text-emerald-400" />}>
              <div className="mb-1.5 grid grid-cols-3 gap-1">
                {([["all", "全部"], ["upto", "以下"], ["single", "単層"]] as [LayerMode, string][]).map(([m, ja]) => (
                  <button
                    key={m}
                    onClick={() => p.setLayerMode(m)}
                    className={`rounded-md py-1 text-[11px] transition ${p.layerMode === m ? "bg-emerald-600 text-white" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"}`}
                  >
                    {ja}
                  </button>
                ))}
              </div>
              {p.layerMode !== "all" && (
                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                    <span>Y =</span>
                    <span className="font-mono text-emerald-300">{p.layerY}</span>
                  </div>
                  <input
                    type="range" min={0} max={p.structure.size[1] - 1} value={Math.min(p.layerY, p.structure.size[1] - 1)}
                    onChange={(e) => p.setLayerY(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              )}
            </Section>

            {/* 表示 */}
            <Section title="表示" icon={<Eye className="h-3.5 w-3.5 text-emerald-400" />}>
              <div className="flex flex-wrap gap-1.5">
                <Toggle on={p.showGrid} onClick={() => p.setShowGrid(!p.showGrid)} label="グリッド" icon={<Grid3x3 className="h-3 w-3" />} />
                <Toggle on={p.showTransparent} onClick={() => p.setShowTransparent(!p.showTransparent)} label="透過表示" icon={p.showTransparent ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} />
                <Toggle on={p.autoRotate} onClick={() => p.setAutoRotate(!p.autoRotate)} label="自動回転" icon={<RotateCw className="h-3 w-3" />} />
              </div>
            </Section>

            <button
              onClick={p.onClear}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-900 bg-red-950/40 py-2 text-[11px] font-bold text-red-300 transition hover:bg-red-900/50"
            >
              <Trash2 className="h-3.5 w-3.5" /> 構造を全消去
            </button>
          </>
        )}

        {tab === "out" && (
          <>
            <Section title="NBTファイル出力" icon={<FileBox className="h-3.5 w-3.5 text-emerald-400" />}>
              <div className="space-y-2">
                <label className="block">
                  <span className="mb-0.5 block text-[10px] text-zinc-500">ファイル名</span>
                  <div className="flex items-center gap-1">
                    <input
                      value={p.fileName} onChange={(e) => p.setFileName(e.target.value.replace(/[^\w\-]/g, ""))}
                      placeholder="my_house"
                      spellCheck={false}
                      className={inputCls}
                    />
                    <span className="font-mono text-[11px] text-zinc-500">.nbt</span>
                  </div>
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[10px] text-zinc-500">作者名 (author)</span>
                  <input value={p.author} onChange={(e) => p.setAuthor(e.target.value)} className={inputCls} />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[10px] text-zinc-500">対象バージョン (DataVersion)</span>
                  <select
                    value={p.dataVersion} onChange={(e) => p.setDataVersion(Number(e.target.value))}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-xs text-zinc-200"
                  >
                    {DATA_VERSIONS.map((d) => (
                      <option key={d.version} value={d.version}>{d.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[10px] text-zinc-500">空気の書き出し方（既存ブロックの扱い）</span>
                  <select
                    value={p.airMode}
                    onChange={(e) => p.setAirMode(e.target.value as AirMode)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-[11px] text-zinc-200"
                  >
                    <option value="omit">省略：軽量・既存ブロックを残す（推奨）</option>
                    <option value="void">構造ボイド：明示的に残す</option>
                    <option value="air">空気を含める：範囲を空気で上書き</option>
                  </select>
                  <span className="mt-1 block font-mono text-[9px] text-zinc-600">
                    書き出しエントリ: {(p.airMode === "omit" ? p.stats.nonAir : p.stats.total).toLocaleString()} / 全体 {p.stats.total.toLocaleString()}
                  </span>
                </label>
                <button
                  onClick={p.onExport}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 py-2.5 text-[13px] font-black text-white shadow-lg shadow-emerald-900/50 transition hover:from-emerald-500 hover:to-green-500"
                >
                  <Download className="h-4 w-4" /> .nbt をダウンロード
                </button>
              </div>
            </Section>

            <Section title="データパック (.zip)" icon={<Package className="h-3.5 w-3.5 text-amber-400" />}>
              <div className="space-y-2">
                <label className="block">
                  <span className="mb-0.5 block text-[10px] text-zinc-500">名前空間 (namespace) — 小文字英数字</span>
                  <input
                    value={p.packNamespace}
                    onChange={(e) => p.setPackNamespace(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                    placeholder="assetmaker"
                    spellCheck={false}
                    className={inputCls}
                  />
                </label>
                <div className="rounded-md bg-zinc-900/80 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-zinc-400">
                  /place structure {p.packNamespace || "assetmaker"}:{p.fileName || "structure"} ~ ~ ~
                </div>
                <button
                  onClick={p.onExportDatapack}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-800 py-2 text-[12px] font-bold text-amber-200 transition hover:bg-zinc-700"
                >
                  <Package className="h-3.5 w-3.5" /> データパックzipを書き出し
                </button>
                <div className="text-[10px] leading-relaxed text-zinc-600">
                  pack.mcmeta（バージョン別pack_format）・structure/フォルダ・README（必要MOD一覧）を同梱します。
                </div>
              </div>
            </Section>

            <Section title="使用ID・MOD依存チェック" icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}>
              {v.total === 0 ? (
                <div className="py-3 text-center text-[11px] text-zinc-600">ブロックがありません</div>
              ) : (
                <div className="space-y-2.5">
                  <div>
                    <div className="mb-1 text-[10px] font-bold text-zinc-400">必要な名前空間</div>
                    <div className="space-y-0.5">
                      {v.namespaces.map((n) => (
                        <div key={n.ns} className="flex items-center justify-between rounded bg-zinc-900/70 px-2 py-1 font-mono text-[10px]">
                          <span className={n.ns === "minecraft" ? "text-zinc-300" : "text-fuchsia-300"}>
                            {n.ns}{n.ns === "minecraft" ? "" : "  ← MOD"}
                          </span>
                          <span className="text-zinc-500">{n.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {v.unregistered.length > 0 && (
                    <div>
                      <div className="mb-1 text-[10px] font-bold text-amber-300">未登録ID（仮ID・未知のブロック）</div>
                      <div className="space-y-0.5">
                        {v.unregistered.map((u) => (
                          <div key={u.id} className="flex items-center gap-1.5 rounded bg-amber-950/30 px-2 py-1">
                            <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-amber-200">{u.id}</span>
                            <span className="font-mono text-[10px] text-zinc-500">{u.count}</span>
                            <button
                              onClick={() => p.onOpenCustom(u.id)}
                              className="rounded bg-fuchsia-700/70 px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-fuchsia-600"
                            >
                              登録
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {v.invalid.length > 0 && (
                    <div>
                      <div className="mb-1 text-[10px] font-bold text-red-400">不正なID（ゲームで読めません）</div>
                      {v.invalid.map((i) => (
                        <div key={i} className="truncate rounded bg-red-950/40 px-2 py-1 font-mono text-[10px] text-red-300">{i}</div>
                      ))}
                    </div>
                  )}

                  {issueCount === 0 && (
                    <div className="rounded bg-emerald-950/40 px-2 py-1.5 text-[10px] text-emerald-300">✓ すべてのIDは有効です</div>
                  )}
                </div>
              )}
              <button
                onClick={() => p.onOpenCustom(null)}
                className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-md border border-fuchsia-900 bg-fuchsia-950/30 py-1.5 text-[11px] font-bold text-fuchsia-300 hover:bg-fuchsia-900/40"
              >
                <Puzzle className="h-3 w-3" /> MOD・カスタムブロック管理
              </button>
            </Section>

            <Section title="NBTインポート" icon={<Upload className="h-3.5 w-3.5 text-emerald-400" />} defaultOpen={false}>
              <label className="block cursor-pointer rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/40 px-3 py-4 text-center transition hover:border-emerald-600 hover:bg-emerald-950/20">
                <Upload className="mx-auto mb-1 h-5 w-5 text-zinc-500" />
                <div className="text-[11px] text-zinc-300">.nbt をドロップ or クリック</div>
                <div className="mt-0.5 text-[10px] text-zinc-600">Java版の構造ファイル。MODブロックも未登録IDのまま読み込めます</div>
                <input
                  type="file" accept=".nbt" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) p.onImportFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {p.lastImport && (
                <div className="mt-2 rounded-md bg-zinc-900/80 px-2 py-1.5 font-mono text-[10px] text-zinc-400">
                  <div>palette: {p.lastImport.paletteSize} / entries: {p.lastImport.blockEntries}</div>
                  {p.lastImport.warnings.slice(0, 3).map((w, i) => (
                    <div key={i} className="text-yellow-400">! {w}</div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="プロジェクト保存" icon={<Save className="h-3.5 w-3.5 text-sky-400" />} defaultOpen={false}>
              <div className="flex gap-1.5">
                <button
                  onClick={p.onSaveProject}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md bg-zinc-800 py-1.5 text-[11px] font-bold text-zinc-200 hover:bg-zinc-700"
                >
                  <Save className="h-3 w-3" /> 保存 (.mcproj.json)
                </button>
                <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md bg-zinc-800 py-1.5 text-[11px] font-bold text-zinc-200 hover:bg-zinc-700">
                  <FolderOpen className="h-3 w-3" /> 開く
                  <input
                    type="file" accept=".json,.mcproj.json" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) p.onOpenProject(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <div className="mt-1.5 text-[10px] leading-relaxed text-zinc-600">
                ブラウザには自動保存されています。プロジェクトファイルは別PCへの持ち出し用です。
              </div>
            </Section>

            <Section title=".mcfunction 出力" icon={<FileCode className="h-3.5 w-3.5 text-emerald-400" />} defaultOpen={false}>
              <div className="flex gap-1.5">
                <button
                  onClick={p.onExportMc}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md bg-zinc-800 py-1.5 text-[11px] font-bold text-zinc-200 hover:bg-zinc-700"
                >
                  <Download className="h-3 w-3" /> .mcfunction保存
                </button>
                <button
                  onClick={p.onCopyMc}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md bg-zinc-800 py-1.5 text-[11px] font-bold text-zinc-200 hover:bg-zinc-700"
                >
                  {p.copiedMc ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />} コピー
                </button>
              </div>
              <button onClick={() => setMcOpen(!mcOpen)} className="mt-1.5 w-full text-center text-[10px] text-zinc-500 hover:text-zinc-300">
                {mcOpen ? "プレビューを閉じる" : `プレビューを開く (${p.mcPreview.split("\n").length}行)`}
              </button>
              {mcOpen && (
                <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-black p-2 font-mono text-[9px] leading-relaxed text-green-300 mc-scroll">
                  {p.mcPreview.split("\n").slice(0, 120).join("\n")}
                  {p.mcPreview.split("\n").length > 120 && "\n…(省略)"}
                </pre>
              )}
            </Section>
          </>
        )}

        {tab === "stat" && (
          <Section title={`ブロック統計 (${p.stats.nonAir}/${p.stats.total})`} icon={<Boxes className="h-3.5 w-3.5 text-emerald-400" />}>
            <div className="mb-2 grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-md bg-zinc-900 px-1 py-1.5">
                <div className="font-mono text-sm font-bold text-white">{p.structure.size.join("×")}</div>
                <div className="text-[9px] text-zinc-500">サイズ</div>
              </div>
              <div className="rounded-md bg-zinc-900 px-1 py-1.5">
                <div className="font-mono text-sm font-bold text-emerald-300">{p.stats.nonAir}</div>
                <div className="text-[9px] text-zinc-500">設置数</div>
              </div>
              <div className="rounded-md bg-zinc-900 px-1 py-1.5">
                <div className="font-mono text-sm font-bold text-amber-300">{paletteSize}</div>
                <div className="text-[9px] text-zinc-500">パレット数</div>
              </div>
            </div>
            <div className="space-y-1">
              {p.stats.stats.length === 0 && (
                <div className="py-6 text-center text-[11px] text-zinc-600">ブロックがありません</div>
              )}
              {p.stats.stats.map((s) => {
                const def = getBlock(s.id);
                const reg = isRegistered(s.id);
                return (
                  <div key={s.id} className="rounded-md bg-zinc-900/60 px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 shrink-0 rounded-sm border border-black/60" style={{ background: def.color }} />
                      <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-200">{def.ja}</span>
                      {!reg && <span className="rounded bg-amber-500/20 px-1 text-[8px] text-amber-300">未登録</span>}
                      <span className="font-mono text-[11px] font-bold text-white">{s.count}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(s.count / maxCount) * 100}%` }} />
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[9px] text-zinc-600">
                      {s.id}{s.propsVariants > 1 ? ` · ${s.propsVariants}種の状態` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {tab === "nbt" && (
          <>
            <Section title="構造ファイル仕様" icon={<Braces className="h-3.5 w-3.5 text-emerald-400" />}>
              <pre className="overflow-x-auto rounded-md bg-black p-2 font-mono text-[9.5px] leading-relaxed text-zinc-300 mc-scroll">
{`TAG_Compound("") {
  TAG_Int DataVersion: ${p.dataVersion}
  TAG_List size: [${p.structure.size.join(", ")}]
  TAG_List palette: ${paletteSize} entries
    └ Name: "minecraft:..." | "mymod:..."
    └ Properties: { facing: "north" … }
  TAG_List blocks: ${(p.airMode === "omit" ? p.stats.nonAir : p.stats.total).toLocaleString()} entries
    └ pos: [x, y, z]
    └ state: <palette index>
    └ nbt?: { Command: "…" }
  TAG_List entities: []
  TAG_String author: "${p.author || "AssetMaker"}"
}  ※ GZip圧縮・BigEndian`}
              </pre>
              <div className="mt-1.5 space-y-1 text-[10px] leading-relaxed text-zinc-500">
                <p><span className="font-bold text-emerald-400">palette</span> … 同じ見た目のブロックを番号化して容量削減。状態(向き等)ごとに別エントリ。</p>
                <p><span className="font-bold text-emerald-400">Name</span> … MODブロックは <span className="font-mono">modid:name</span> をそのまま書き込みます。</p>
                <p><span className="font-bold text-emerald-400">DataVersion</span> … 対象の版に合わせて選択。</p>
              </div>
            </Section>
            <Section title="使い方 (ワールド導入)" icon={<FileBox className="h-3.5 w-3.5 text-emerald-400" />}>
              <ol className="list-decimal space-y-1 pl-4 text-[10px] leading-relaxed text-zinc-400">
                <li>このツールで <span className="font-mono text-emerald-300">.nbt</span> またはデータパックzipを出力</li>
                <li>シングル: <span className="font-mono text-zinc-300">saves/ワールド/generated/&lt;ns&gt;/structures/</span> に配置（1.21以降は <span className="font-mono">structure</span>）</li>
                <li>MODブロックを使う場合は、同じMODをサーバー/クライアントに導入</li>
                <li>ストラクチャーブロックのロードで名前指定（<span className="font-mono">&lt;ns&gt;:名前</span>）</li>
              </ol>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
