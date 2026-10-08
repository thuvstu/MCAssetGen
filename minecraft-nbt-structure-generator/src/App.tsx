import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes, Download, Upload, HelpCircle, Sparkles, Cuboid as CubeIcon, X,
  Layers, Palette as PaletteIcon, Wrench, FileDown, Braces, Gamepad2, FolderOpen, AlertTriangle, Puzzle,
  RefreshCw, Grid2X2, Save, ShieldCheck,
} from "lucide-react";
import VoxelCanvas, { type ToolId, type LayerMode } from "./components/VoxelCanvas";
import BlockPalette from "./components/BlockPalette";
import RightPanel from "./components/RightPanel";
import CustomBlockModal from "./components/CustomBlockModal";
import LayerEditor from "./components/LayerEditor";
import WelcomeModal from "./components/WelcomeModal";
import ErrorBoundary from "./components/ErrorBoundary";
import {
  createStructure, opBox, opEllipsoid, opCylinder, opLine, opFloodFill,
  opReplace, opClear, opFillSelection, resizeStructure, getStats, structureToNbt, nbtToStructure,
  structureToMcFunction, SAMPLES, getCell,
  createSelection, copySelection, pasteClipboard, repeatClipboard,
  structureDifference, opSetMany, brushCells, MAX_SIZE, type CellEdit, type AirMode,
  type Structure, type Vec3, type PlacedBlock, type VoxelSelection, type StructureClipboard,
} from "./lib/structure";
import { encodeStructureFile, decodeStructureFile, formatBytes } from "./lib/nbt";
import { getBlock, resolveBlockId, setCustomBlocks, type BlockDef } from "./lib/minecraft-data";
import { loadCustomBlocks, persistCustomBlocks } from "./lib/custom-blocks";
import {
  transformStructure, renameBlockId, validateStructure, DEFAULT_META, serializeProject,
  deserializeProject, writeAutosave, readAutosave, type TransformKind, type ProjectMeta,
  symmetryVariants, mirrorPos, mirrorBlock, type SymmetryVariant,
} from "./lib/operations";
import { buildDatapackZip } from "./lib/datapack";

export const APP_VERSION = "1.0.0";
const WELCOME_KEY = "mam_welcome_dismissed";

type MobileTab = "blocks" | "view" | "tools";

const SHAPE_TOOLS: ToolId[] = ["box", "hollow", "walls", "sphere", "hsphere", "cylinder", "line"];
const TRANSFORM_LABEL: Record<TransformKind, string> = {
  rotY: "Y軸90°回転",
  flipX: "X軸反転",
  flipZ: "Z軸反転",
};

function download(data: Uint8Array | string, name: string, mime: string) {
  const blob = typeof data === "string" ? new Blob([data], { type: mime }) : new Blob([data as unknown as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const timeLabel = (d: Date) => d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

type ShapeTool = "box" | "hollow" | "walls" | "sphere" | "hsphere" | "cylinder" | "line";

/** 形状ツールを1つ適用する（対称配置で同じ処理を複数回呼ぶため切り出し） */
function applyShape(s: Structure, tool: ShapeTool, a: Vec3, b: Vec3, block: PlacedBlock | null): Structure {
  switch (tool) {
    case "box": return opBox(s, a, b, block, false);
    case "hollow": return opBox(s, a, b, block, true);
    case "walls": return opBox(s, a, b, block, false, true);
    case "sphere": return opEllipsoid(s, a, b, block, false);
    case "hsphere": return opEllipsoid(s, a, b, block, true);
    case "cylinder": return opCylinder(s, a, b, block, false);
    case "line": return opLine(s, a, b, block);
  }
}

/** 対称パターンごとに座標とブロック(向き)を複製し、同一座標は1回だけ残す */
function symmetricEdits(points: Vec3[], block: PlacedBlock | null, size: Vec3, variants: SymmetryVariant[]): CellEdit[] {
  const seen = new Set<string>();
  const out: CellEdit[] = [];
  for (const v of variants) {
    for (const p of points) {
      const q = mirrorPos(p, size, v);
      const key = q.join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ pos: q, block: mirrorBlock(block, v) });
    }
  }
  return out;
}

export default function App() {
  // ---------- 起動: 自動保存・カスタムブロック・初回フラグを復元 ----------
  const [boot] = useState(() => {
    const saved = readAutosave();
    const custom = loadCustomBlocks();
    setCustomBlocks(custom);
    let welcomeDismissed = false;
    try {
      welcomeDismissed = localStorage.getItem(WELCOME_KEY) === "1";
    } catch {
      /* プライベートモード等 */
    }
    return { saved, custom, welcomeDismissed };
  });
  const bootMeta: ProjectMeta = boot.saved?.meta ?? DEFAULT_META;

  const [structure, setStructure] = useState<Structure>(() => boot.saved?.structure ?? SAMPLES[0].make());
  const [history, setHistory] = useState<Structure[]>([]);
  const [future, setFuture] = useState<Structure[]>([]);

  const [customBlocks, setCustomBlocksState] = useState<BlockDef[]>(boot.custom);
  const [customModal, setCustomModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const [selectedId, setSelectedId] = useState(bootMeta.selectedId);
  const [selectedProps, setSelectedProps] = useState<Record<string, string>>(() => ({ ...(getBlock(bootMeta.selectedId).defaults ?? {}) }));
  const [command, setCommand] = useState("say AssetMakerからこんにちは！");
  const [recent, setRecent] = useState<string[]>(bootMeta.recent);

  const [tool, setTool] = useState<ToolId>("brush");
  const [brushSize, setBrushSize] = useState(1);
  const [pendingFirst, setPendingFirst] = useState<Vec3 | null>(null);
  const [selection, setSelection] = useState<VoxelSelection | null>(null);
  const [clipboard, setClipboard] = useState<StructureClipboard | null>(null);
  const [hoverPos, setHoverPos] = useState<Vec3 | null>(null);

  const [layerMode, setLayerMode] = useState<LayerMode>("all");
  const [layerY, setLayerY] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showTransparent, setShowTransparent] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [mirrorX, setMirrorX] = useState(false);
  const [mirrorZ, setMirrorZ] = useState(false);
  const [airMode, setAirMode] = useState<AirMode>(bootMeta.airMode ?? "omit");

  const [author, setAuthor] = useState(bootMeta.author);
  const [dataVersion, setDataVersion] = useState(bootMeta.dataVersion);
  const [fileName, setFileName] = useState(bootMeta.fileName);
  const [packNamespace, setPackNamespace] = useState(bootMeta.packNamespace ?? "assetmaker");
  const [replaceFrom, setReplaceFrom] = useState("");
  const [lastImport, setLastImport] = useState<{ paletteSize: number; blockEntries: number; warnings: string[] } | null>(null);
  const [newSize, setNewSize] = useState<Vec3>([16, 16, 16]);

  const [toast, setToast] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [layerEditorOpen, setLayerEditorOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(() => !boot.saved && !boot.welcomeDismissed);
  const [mobileTab, setMobileTab] = useState<MobileTab>("view");
  const [copiedMc, setCopiedMc] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveWarned = useRef(false);
  const ackUnregistered = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const stats = useMemo(() => getStats(structure), [structure]);
  const validation = useMemo(() => validateStructure(structure), [structure]);
  const mcPreview = useMemo(() => structureToMcFunction(structure), [structure]);
  const meta: ProjectMeta = useMemo(
    () => ({ author, fileName, dataVersion, selectedId, recent, airMode, packNamespace }),
    [author, fileName, dataVersion, selectedId, recent, airMode, packNamespace]
  );

  // 起動時の復元通知
  useEffect(() => {
    if (boot.saved) showToast(`前回の作業を復元しました（${boot.saved.structure.size.join("×")} / ${boot.saved.meta.fileName}）`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ブラウザタブのタイトルを作業中ファイルに連動
  useEffect(() => {
    document.title = `${fileName || "structure"} · Minecraft Asset Maker`;
  }, [fileName]);

  // ---------- 自動保存（デバウンス + 離脱時フラッシュ） ----------
  const latestRef = useRef({ structure, meta });
  latestRef.current = { structure, meta };

  useEffect(() => {
    const t = setTimeout(() => {
      const ok = writeAutosave(structure, meta);
      if (ok) {
        setLastSaved(new Date());
        autosaveWarned.current = false;
      } else if (!autosaveWarned.current) {
        autosaveWarned.current = true;
        showToast("自動保存の容量を超えました。「プロジェクト保存」でファイルに退避してください");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [structure, meta, showToast]);

  useEffect(() => {
    const flush = () => writeAutosave(latestRef.current.structure, latestRef.current.meta);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // ---------- カスタムブロック ----------
  const updateCustomBlocks = useCallback((defs: BlockDef[]) => {
    persistCustomBlocks(defs);
    setCustomBlocksState(defs);
  }, []);

  const openCustom = useCallback((id: string | null) => setCustomModal({ open: true, id }), []);

  const selectedBlock: PlacedBlock = useMemo(() => {
    const def = getBlock(selectedId);
    const props: Record<string, string> = {};
    if (def.props) {
      for (const k of Object.keys(def.props)) {
        const v = selectedProps[k] ?? def.defaults?.[k] ?? def.props[k][0];
        if (v !== undefined && v !== "") props[k] = v;
      }
    } else {
      for (const [k, v] of Object.entries(selectedProps)) if (v !== "") props[k] = v;
    }
    return {
      id: resolveBlockId(selectedId),
      props,
      command: selectedId.includes("command_block") ? command : undefined,
    };
    // customBlocks の更新で定義済みプロパティが変わるため依存に含める
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedProps, command, customBlocks]);

  const pushHistory = useCallback((next: Structure) => {
    setHistory((h) => [...h.slice(-49), structure]);
    setFuture([]);
    setStructure(next);
  }, [structure]);

  /** 別の構造に丸ごと差し替え (履歴には残す) */
  const replaceStructure = useCallback((next: Structure, name?: string) => {
    setHistory((h) => [...h.slice(-49), structure]);
    setFuture([]);
    setStructure(next);
    setPendingFirst(null);
    setSelection(null);
    setLayerY(0);
    if (name) setFileName(name);
  }, [structure]);

  const touchRecent = useCallback((id: string) => {
    setRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 24));
  }, []);

  const handleSelectBlock = useCallback((id: string) => {
    setSelectedId(id);
    setSelectedProps({ ...(getBlock(id).defaults ?? {}) });
    touchRecent(id);
    if (id === "minecraft:air") setTool("erase");
    else if (tool === "erase") setTool("brush");
  }, [touchRecent, tool]);

  // ---------- 3Dアクション ----------
  const handleCellAction = useCallback((pos: Vec3, erase: boolean) => {
    const variants = symmetryVariants(mirrorX, mirrorZ);
    const [sx, sy, sz] = structure.size;
    if (pos[0] < 0 || pos[1] < 0 || pos[2] < 0 || pos[0] >= sx || pos[1] >= sy || pos[2] >= sz) return;

    if (erase && pendingFirst && (SHAPE_TOOLS.includes(tool) || tool === "select")) {
      setPendingFirst(null);
      return;
    }

    const block: PlacedBlock | null = erase ? null : { ...selectedBlock, props: { ...selectedBlock.props } };

    switch (tool) {
      case "brush":
      case "erase": {
        const editBlock = tool === "erase" ? null : block;
        const edits = symmetricEdits(brushCells(structure.size, pos, brushSize), editBlock, structure.size, variants);
        pushHistory(opSetMany(structure, edits));
        if (editBlock) touchRecent(selectedBlock.id);
        break;
      }
      case "picker": {
        const c = getCell(structure, pos[0], pos[1], pos[2]);
        if (c) {
          setSelectedId(c.id);
          setSelectedProps({ ...c.props });
          if (c.command) setCommand(c.command);
          touchRecent(c.id);
          setTool("brush");
          showToast(`${getBlock(c.id).ja} を選択`);
        }
        break;
      }
      case "fill":
        pushHistory(opFloodFill(structure, pos[0], pos[1], pos[2], block));
        if (!erase) touchRecent(selectedBlock.id);
        break;
      case "select":
        if (!pendingFirst) {
          setPendingFirst(pos);
          showToast(`選択始点 [${pos.join(", ")}] — 終点をクリック`);
        } else {
          const nextSelection = createSelection(pendingFirst, pos);
          setSelection(nextSelection);
          setPendingFirst(null);
          showToast(`範囲を選択: ${nextSelection.min.join(",")} → ${nextSelection.max.join(",")}`);
        }
        break;
      case "box":
      case "hollow":
      case "walls":
      case "sphere":
      case "hsphere":
      case "cylinder":
      case "line": {
        if (!pendingFirst) {
          setPendingFirst(pos);
          showToast(`始点 [${pos.join(", ")}] — 終点をクリック`);
        } else {
          let next = structure;
          const seenPairs = new Set<string>();
          for (const v of variants) {
            const a2 = mirrorPos(pendingFirst, structure.size, v);
            const b2 = mirrorPos(pos, structure.size, v);
            const pairKey = `${a2.join(",")}|${b2.join(",")}`;
            if (seenPairs.has(pairKey)) continue;
            seenPairs.add(pairKey);
            next = applyShape(next, tool as ShapeTool, a2, b2, mirrorBlock(block, v));
          }
          pushHistory(next);
          setPendingFirst(null);
          if (!erase) touchRecent(selectedBlock.id);
          showToast("形状を生成しました");
        }
        break;
      }
    }
  }, [structure, tool, pendingFirst, selectedBlock, brushSize, mirrorX, mirrorZ, pushHistory, touchRecent, showToast]);

  const handleUndo = useCallback(() => {
    if (!history.length) return;
    setFuture((f) => [structure, ...f]);
    setStructure(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setPendingFirst(null);
  }, [history, structure]);

  const handleRedo = useCallback(() => {
    if (!future.length) return;
    setHistory((h) => [...h, structure]);
    setStructure(future[0]);
    setFuture((f) => f.slice(1));
    setPendingFirst(null);
  }, [future, structure]);

  const handleTransform = useCallback((kind: TransformKind) => {
    pushHistory(transformStructure(structure, kind));
    setPendingFirst(null);
    setSelection(null);
    showToast(`${TRANSFORM_LABEL[kind]}を適用しました`);
  }, [structure, pushHistory, showToast]);

  const handleRenameId = useCallback((from: string, to: string) => {
    const count = structure.cells.reduce((a, c) => a + (c && c.id === from ? 1 : 0), 0);
    if (!count) {
      showToast("該当ブロックがありません");
      return;
    }
    pushHistory(renameBlockId(structure, from, to));
    showToast(`${count}個のIDを変換: ${from} → ${to}`);
  }, [structure, pushHistory, showToast]);

  // ---------- 選択範囲 / クリップボード ----------
  const handleCopySelection = useCallback((cut: boolean) => {
    if (!selection) {
      showToast("先に「選択」ツール（Q）で範囲を作成してください");
      return;
    }
    const nextClipboard = copySelection(structure, selection);
    setClipboard(nextClipboard);
    if (cut) {
      pushHistory(opFillSelection(structure, selection, null));
      showToast(`範囲を切り取り: ${nextClipboard.size.join("×")}`);
    } else {
      showToast(`範囲をコピー: ${nextClipboard.size.join("×")}`);
    }
  }, [selection, structure, pushHistory, showToast]);

  const handlePasteSelection = useCallback((origin: Vec3, overwriteAir: boolean, repeats: Vec3, gap: Vec3) => {
    if (!clipboard) {
      showToast("クリップボードが空です");
      return;
    }
    const count = repeats[0] * repeats[1] * repeats[2];
    const next = count > 1
      ? repeatClipboard(structure, clipboard, origin, repeats, gap, overwriteAir)
      : pasteClipboard(structure, clipboard, origin, overwriteAir);
    pushHistory(next);
    showToast(count > 1 ? `${count}個の範囲を反復配置しました` : "貼り付けました");
  }, [clipboard, structure, pushHistory, showToast]);

  const handleFillSelection = useCallback(() => {
    if (!selection) return;
    pushHistory(opFillSelection(structure, selection, selectedBlock));
    touchRecent(selectedBlock.id);
    showToast("選択範囲を塗りつぶしました");
  }, [selection, structure, selectedBlock, pushHistory, touchRecent, showToast]);

  const handleClearSelection = useCallback(() => {
    if (!selection) return;
    pushHistory(opFillSelection(structure, selection, null));
    showToast("選択範囲を消去しました");
  }, [selection, structure, pushHistory, showToast]);

  /** 2Dエディタの1ストローク全体を、履歴1件として確定 */
  const handleLayerStroke = useCallback((points: { x: number; z: number }[], y: number, erase: boolean) => {
    if (!points.length) return;
    const variants = symmetryVariants(mirrorX, mirrorZ);
    const block = erase ? null : selectedBlock;
    const positions: Vec3[] = points.map((p): Vec3 => [p.x, y, p.z]);
    pushHistory(opSetMany(structure, symmetricEdits(positions, block, structure.size, variants)));
    if (!erase) touchRecent(selectedBlock.id);
  }, [structure, selectedBlock, mirrorX, mirrorZ, pushHistory, touchRecent]);

  const handleFillLayer = useCallback((y: number, erase: boolean) => {
    const sel: VoxelSelection = { min: [0, y, 0], max: [structure.size[0] - 1, y, structure.size[2] - 1] };
    pushHistory(opFillSelection(structure, sel, erase ? null : selectedBlock));
    if (!erase) touchRecent(selectedBlock.id);
    showToast(`Y=${y} のレイヤーを${erase ? "消去" : "塗りつぶし"}しました`);
  }, [structure, selectedBlock, pushHistory, touchRecent, showToast]);

  /** Ctrl+V: カーソル位置（なければ選択始点）に合成貼り付け */
  const handlePasteAtCursor = useCallback(() => {
    if (!clipboard) {
      showToast("クリップボードが空です（Ctrl+C でコピー）");
      return;
    }
    const origin: Vec3 = hoverPos ?? (selection ? ([...selection.min] as Vec3) : [0, 0, 0]);
    pushHistory(pasteClipboard(structure, clipboard, origin, false));
    showToast(`[${origin.join(", ")}] に貼り付けました`);
  }, [clipboard, hoverPos, selection, structure, pushHistory, showToast]);

  const handleSelectAll = useCallback(() => {
    const [sx, sy, sz] = structure.size;
    setSelection({ min: [0, 0, 0], max: [sx - 1, sy - 1, sz - 1] });
    setPendingFirst(null);
    setTool("select");
    showToast("全体を選択しました");
  }, [structure.size, showToast]);

  const handleClearAll = useCallback(() => {
    if (stats.nonAir === 0) {
      showToast("すでに空です");
      return;
    }
    if (!window.confirm(`${stats.nonAir.toLocaleString()}個のブロックをすべて消去しますか？（Ctrl+Z で戻せます）`)) return;
    pushHistory(opClear(structure));
    setSelection(null);
    showToast("全消去しました");
  }, [stats.nonAir, structure, pushHistory, showToast]);

  const handleNewCanvas = useCallback((size: Vec3) => {
    const clamp = (n: number) => Math.max(1, Math.min(MAX_SIZE, Math.floor(n) || 1));
    const s: Vec3 = [clamp(size[0]), clamp(size[1]), clamp(size[2])];
    replaceStructure(createStructure(s[0], s[1], s[2]), "new_structure");
    showToast(`空の ${s.join("×")} キャンバスを作成しました`);
  }, [replaceStructure, showToast]);

  // ---------- 入出力 ----------
  /** 出力前チェック: 不正IDは拒否、未登録IDはセッション中1回だけ確認 */
  const preflightExport = useCallback((): boolean => {
    if (validation.invalid.length) {
      showToast(`不正なブロックIDが含まれているため出力できません: ${validation.invalid[0]}`);
      return false;
    }
    if (validation.unregistered.length && !ackUnregistered.current) {
      const total = validation.unregistered.reduce((a, u) => a + u.count, 0);
      const ok = window.confirm(
        `未登録のブロックID（${validation.unregistered.length}種・${total}個）が含まれています。\n` +
          `対応するMODが無い環境で読み込むと、その部分は空気になります。\n\n` +
          `このまま出力しますか？（このセッション中は再確認しません）`
      );
      if (!ok) return false;
      ackUnregistered.current = true;
    }
    return true;
  }, [validation, showToast]);

  const buildVerifiedNbt = useCallback(async (): Promise<Uint8Array> => {
    const file = await encodeStructureFile(structureToNbt(structure, author, dataVersion, { airMode }));
    // 書き出したバイナリを読み戻し、圧縮・タグ構造・座標・パレット・コマンドが一致するか検査
    const parsed = nbtToStructure(await decodeStructureFile(file));
    const difference = structureDifference(structure, parsed.structure, airMode === "void");
    if (difference) throw new Error(`NBTセルフチェックに失敗しました: ${difference}`);
    if (parsed.dataVersion !== dataVersion) throw new Error("NBTセルフチェックに失敗しました: DataVersion不一致");
    return file;
  }, [structure, author, dataVersion, airMode]);

  const handleExport = useCallback(async () => {
    if (!preflightExport()) return;
    try {
      setBusy("NBTを書き出し・セルフチェック中…");
      const file = await buildVerifiedNbt();
      download(file, `${fileName || "structure"}.nbt`, "application/octet-stream");
      showToast(`セルフチェック済みで出力: ${fileName || "structure"}.nbt (${formatBytes(file.length)})`);
    } catch (err) {
      showToast(`出力失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }, [preflightExport, buildVerifiedNbt, fileName, showToast]);

  const handleExportDatapack = useCallback(async () => {
    if (!preflightExport()) return;
    try {
      setBusy("データパックを生成・セルフチェック中…");
      const nbt = await buildVerifiedNbt();
      const name = (fileName || "structure").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
      const ns = packNamespace || "assetmaker";
      const zip = buildDatapackZip({ packName: `${name}_datapack`, namespace: ns, structName: name, nbt, dataVersion, validation, author });
      download(zip, `${name}_datapack.zip`, "application/zip");
      showToast(`データパックを出力: /place structure ${ns}:${name}`);
    } catch (err) {
      showToast(`出力失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }, [preflightExport, buildVerifiedNbt, author, dataVersion, fileName, packNamespace, validation, showToast]);

  const handleImportFile = useCallback(async (f: File) => {
    if (/\.mcstructure$/i.test(f.name)) {
      showToast("Bedrock版の .mcstructure は未対応です。Java版のストラクチャー .nbt を使用してください");
      return;
    }
    try {
      setBusy(`読み込み中: ${f.name}…`);
      const buf = new Uint8Array(await f.arrayBuffer());
      const root = await decodeStructureFile(buf);
      const parsed = nbtToStructure(root);
      replaceStructure(parsed.structure, f.name.replace(/\.(nbt|dat)$/i, "").replace(/[^\w\-]/g, "_") || "imported");
      setAuthor(parsed.author || "AssetMaker");
      if (parsed.dataVersion) setDataVersion(parsed.dataVersion);
      setLastImport({ paletteSize: parsed.paletteSize, blockEntries: parsed.blockEntries, warnings: parsed.warnings });
      showToast(`読込完了: ${parsed.structure.size.join("×")} / ${parsed.paletteSize}パレット${parsed.warnings.length ? `（警告 ${parsed.warnings.length}件）` : ""}`);
      if (parsed.warnings.length) console.warn(parsed.warnings);
    } catch (err) {
      showToast(`読込失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }, [replaceStructure, showToast]);

  const handleSaveProject = useCallback(() => {
    download(serializeProject(structure, meta), `${fileName || "project"}.mcproj.json`, "application/json");
    showToast("プロジェクトを保存しました（.mcproj.json）");
  }, [structure, meta, fileName, showToast]);

  const handleOpenProject = useCallback(async (f: File) => {
    try {
      const { structure: st, meta: m } = deserializeProject(await f.text());
      replaceStructure(st);
      setAuthor(m.author);
      setFileName(m.fileName);
      setDataVersion(m.dataVersion);
      setSelectedId(m.selectedId);
      setSelectedProps({ ...(getBlock(m.selectedId).defaults ?? {}) });
      setRecent(m.recent);
      setAirMode(m.airMode ?? "omit");
      setPackNamespace(m.packNamespace ?? "assetmaker");
      showToast(`プロジェクト「${m.fileName}」を読み込みました`);
    } catch (err) {
      showToast(`読込失敗: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [replaceStructure, showToast]);

  /** 拡張子で .nbt / プロジェクトJSON を振り分け */
  const openAnyFile = useCallback((f: File) => {
    if (/\.json$/i.test(f.name)) handleOpenProject(f);
    else handleImportFile(f);
  }, [handleOpenProject, handleImportFile]);

  // ドラッグ&ドロップ
  useEffect(() => {
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer?.files?.[0];
      if (f) openAnyFile(f);
    };
    const onOver = (e: DragEvent) => e.preventDefault();
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragover", onOver);
    return () => {
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragover", onOver);
    };
  }, [openAnyFile]);

  const handleExportMc = useCallback(() => {
    download(mcPreview, `${fileName || "structure"}.mcfunction`, "text/plain");
    showToast(".mcfunction を出力しました");
  }, [mcPreview, fileName, showToast]);

  const handleCopyMc = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mcPreview);
      setCopiedMc(true);
      showToast("コマンドをコピーしました");
      setTimeout(() => setCopiedMc(false), 2000);
    } catch {
      showToast("コピーに失敗しました");
    }
  }, [mcPreview, showToast]);

  // ---------- キーボードショートカット ----------
  const blockingModal = helpOpen || samplesOpen || customModal.open || welcomeOpen;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      const lower = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;

      if (e.key === "Escape") {
        setPendingFirst(null);
        setHelpOpen(false);
        setSamplesOpen(false);
        setLayerEditorOpen(false);
        setWelcomeOpen(false);
        setCustomModal({ open: false, id: null });
        return;
      }
      if (blockingModal) return; // ダイアログ表示中は背後の編集ショートカットを無効化

      if (mod && !e.altKey) {
        if (lower === "z") { e.preventDefault(); if (e.shiftKey) handleRedo(); else handleUndo(); }
        else if (lower === "y") { e.preventDefault(); handleRedo(); }
        else if (lower === "s") { e.preventDefault(); handleSaveProject(); }
        else if (layerEditorOpen) return;
        else if (lower === "c") { e.preventDefault(); handleCopySelection(false); }
        else if (lower === "x") { e.preventDefault(); handleCopySelection(true); }
        else if (lower === "v") { e.preventDefault(); handlePasteAtCursor(); }
        else if (lower === "a") { e.preventDefault(); handleSelectAll(); }
        return;
      }
      if (e.altKey) return;
      if (lower === "x") { setMirrorX((v) => !v); return; }
      if (lower === "z") { setMirrorZ((v) => !v); return; }
      if (layerEditorOpen) return; // 2Dエディタ中は上記以外を無効化

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selection) { e.preventDefault(); handleClearSelection(); }
        return;
      }
      if (lower === "b") setTool("brush");
      else if (lower === "e") setTool("erase");
      else if (lower === "f") setTool("fill");
      else if (lower === "i") setTool("picker");
      else if (lower === "q") setTool("select");
      else if (lower === "r") handleTransform("rotY");
      else if (lower === "m") handleTransform("flipX");
      else if (lower === "n") handleTransform("flipZ");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    blockingModal, layerEditorOpen, selection,
    handleUndo, handleRedo, handleTransform, handleCopySelection, handleClearSelection,
    handlePasteAtCursor, handleSelectAll, handleSaveProject,
  ]);

  const ghostColor = getBlock(selectedId).color === "#00000000" ? "#ef4444" : getBlock(selectedId).color;
  const issueCount = validation.unregistered.length + validation.invalid.length;
  const paletteVariants = 1 + stats.stats.reduce((a, s) => a + s.propsVariants, 0);

  const openLayerEditor = () => {
    setLayerMode("single");
    setLayerEditorOpen(true);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#070b09] text-zinc-200">
      {/* ===== ヘッダー ===== */}
      <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-emerald-900/50 bg-gradient-to-r from-zinc-950 via-[#0b1510] to-zinc-950 px-3 sm:gap-3 sm:px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-green-700 shadow-lg shadow-emerald-900/60">
            <CubeIcon className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <h1 className="font-pixel text-[15px] font-bold tracking-wide text-white sm:text-base">Minecraft Asset Maker</h1>
            <p className="hidden text-[10px] text-emerald-400/90 sm:block">
              NBT構造物スタジオ <span className="text-zinc-600">·</span> <span className="font-mono text-zinc-400">{fileName || "structure"}.nbt</span>
            </p>
          </div>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => openCustom(null)}
          className="flex items-center gap-1.5 rounded-lg border border-fuchsia-800/70 bg-fuchsia-950/30 px-2.5 py-1.5 text-[11px] font-bold text-fuchsia-200 transition hover:bg-fuchsia-900/50 sm:px-3"
        >
          <Puzzle className="h-3.5 w-3.5 text-fuchsia-400" />
          <span className="hidden sm:inline">MOD</span>
        </button>
        <button
          onClick={() => setSamplesOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-bold text-zinc-200 transition hover:border-emerald-600 hover:bg-zinc-800 sm:px-3"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden sm:inline">新規 / サンプル</span>
        </button>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-bold text-zinc-200 transition hover:border-emerald-600 hover:bg-zinc-800 sm:px-3">
          <Upload className="h-3.5 w-3.5 text-sky-400" />
          <span className="hidden sm:inline">開く</span>
          <input
            type="file" accept=".nbt,.json" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) openAnyFile(f);
              e.target.value = "";
            }}
          />
        </label>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-1.5 text-[11px] font-black text-white shadow-lg shadow-emerald-900/50 transition hover:from-emerald-400 hover:to-green-500 sm:px-4 sm:text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          .nbt出力
        </button>
        <button
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300 transition hover:bg-zinc-800 sm:px-3"
        >
          <HelpCircle className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">使い方</span>
        </button>
      </header>

      {/* ===== モバイルタブ ===== */}
      <div className="grid shrink-0 grid-cols-3 gap-1 border-b border-zinc-800 bg-zinc-950 p-1.5 lg:hidden">
        {([["blocks", "ブロック", PaletteIcon], ["view", "3D編集", Boxes], ["tools", "ツール", Wrench]] as [MobileTab, string, typeof Boxes][]).map(([id, ja, Icon]) => (
          <button
            key={id}
            onClick={() => setMobileTab(id)}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-bold ${mobileTab === id ? "bg-emerald-600 text-white" : "bg-zinc-900 text-zinc-400"}`}
          >
            <Icon className="h-3.5 w-3.5" /> {ja}
          </button>
        ))}
      </div>

      {/* ===== メイン ===== */}
      <main className="flex min-h-0 flex-1 gap-2 p-2">
        {/* 左: パレット */}
        <aside className={`w-full shrink-0 flex-col rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-2.5 lg:flex lg:w-[300px] ${mobileTab === "blocks" ? "flex" : "hidden"}`}>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-zinc-400">
            <PaletteIcon className="h-3.5 w-3.5 text-emerald-400" /> ブロックパレット
          </div>
          <div className="min-h-0 flex-1">
            <BlockPalette
              selectedId={selectedId}
              selectedProps={selectedProps}
              command={command}
              recent={recent}
              customBlocks={customBlocks}
              onSelect={handleSelectBlock}
              onPropsChange={setSelectedProps}
              onCommandChange={setCommand}
              onOpenCustom={openCustom}
            />
          </div>
        </aside>

        {/* 中央: 3D（WebGL不可時は2Dへ誘導） */}
        <section className={`min-h-0 min-w-0 flex-1 flex-col ${mobileTab === "view" ? "flex" : "hidden lg:flex"}`}>
          <ErrorBoundary
            fallback={(error, reset) => (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border border-red-900/60 bg-zinc-950 p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-400" />
                <div className="text-sm font-bold text-white">3Dビューを表示できません</div>
                <p className="max-w-md text-[11px] leading-relaxed text-zinc-400">
                  WebGLが利用できないか、描画中にエラーが発生しました。作業内容は自動保存されています。
                  2Dレイヤーエディタで編集と書き出しを続けられます。
                  <br />
                  <span className="font-mono text-[10px] text-red-300">{error.message}</span>
                </p>
                <div className="flex gap-2">
                  <button onClick={reset} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] font-bold text-zinc-200 hover:bg-zinc-800">
                    <RefreshCw className="h-3.5 w-3.5" /> 再試行
                  </button>
                  <button onClick={openLayerEditor} className="flex items-center gap-1.5 rounded-lg bg-sky-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-sky-600">
                    <Grid2X2 className="h-3.5 w-3.5" /> 2Dエディタを開く
                  </button>
                </div>
              </div>
            )}
          >
            <VoxelCanvas
              structure={structure}
              tool={tool}
              layerMode={layerMode}
              layerY={layerY}
              showGrid={showGrid}
              showTransparent={showTransparent}
              autoRotate={autoRotate}
              pendingFirst={pendingFirst}
              selection={selection}
              mirrorX={mirrorX}
              mirrorZ={mirrorZ}
              ghostColor={ghostColor}
              onCellAction={handleCellAction}
              onHover={setHoverPos}
              hoverPos={hoverPos}
            />
          </ErrorBoundary>
        </section>

        {/* 右: ツール */}
        <aside className={`w-full shrink-0 flex-col rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-2.5 lg:flex lg:w-[320px] ${mobileTab === "tools" ? "flex" : "hidden"}`}>
          <RightPanel
            tool={tool} setTool={(t) => { setTool(t); setPendingFirst(null); }}
            brushSize={brushSize} setBrushSize={setBrushSize}
            structure={structure} stats={stats}
            onResize={(x, y, z) => { pushHistory(resizeStructure(structure, x, y, z)); setLayerY(0); setSelection(null); showToast(`サイズ変更: ${x}×${y}×${z}`); }}
            layerMode={layerMode} setLayerMode={setLayerMode}
            layerY={layerY} setLayerY={setLayerY}
            showGrid={showGrid} setShowGrid={setShowGrid}
            showTransparent={showTransparent} setShowTransparent={setShowTransparent}
            autoRotate={autoRotate} setAutoRotate={setAutoRotate}
            author={author} setAuthor={setAuthor}
            dataVersion={dataVersion} setDataVersion={setDataVersion}
            fileName={fileName} setFileName={setFileName}
            onExport={handleExport}
            onImportFile={handleImportFile}
            onExportMc={handleExportMc}
            mcPreview={mcPreview}
            onCopyMc={handleCopyMc}
            copiedMc={copiedMc}
            onClear={handleClearAll}
            onUndo={handleUndo} onRedo={handleRedo}
            canUndo={history.length > 0} canRedo={future.length > 0}
            pendingFirst={pendingFirst}
            onCancelPending={() => setPendingFirst(null)}
            replaceFrom={replaceFrom} setReplaceFrom={setReplaceFrom}
            onReplace={() => {
              if (!replaceFrom) return;
              pushHistory(opReplace(structure, replaceFrom, selectedBlock));
              showToast("置換しました");
            }}
            lastImport={lastImport}
            selectedId={selectedId}
            onTransform={handleTransform}
            onRenameId={handleRenameId}
            validation={validation}
            packNamespace={packNamespace} setPackNamespace={setPackNamespace}
            onExportDatapack={handleExportDatapack}
            onSaveProject={handleSaveProject}
            onOpenProject={handleOpenProject}
            onOpenCustom={openCustom}
            selection={selection}
            clipboard={clipboard}
            onCopySelection={handleCopySelection}
            onPasteSelection={handlePasteSelection}
            onFillSelection={handleFillSelection}
            onClearSelection={handleClearSelection}
            onClearSelectionBox={() => setSelection(null)}
            onOpenLayerEditor={openLayerEditor}
            airMode={airMode} setAirMode={setAirMode}
            mirrorX={mirrorX} setMirrorX={setMirrorX}
            mirrorZ={mirrorZ} setMirrorZ={setMirrorZ}
          />
        </aside>
      </main>

      {/* ===== ステータスバー ===== */}
      <footer className="flex h-8 shrink-0 items-center gap-3 overflow-x-auto border-t border-emerald-900/50 bg-zinc-950 px-3 font-mono text-[10px] text-zinc-500">
        <span className="flex items-center gap-1 whitespace-nowrap">
          <Layers className="h-3 w-3 text-emerald-500" />
          <span className="text-zinc-300">{structure.size.join("×")}</span>
        </span>
        <span className="whitespace-nowrap">blocks <span className="text-emerald-300">{stats.nonAir.toLocaleString()}</span>/{stats.total.toLocaleString()}</span>
        <span className="whitespace-nowrap">palette <span className="text-amber-300">{paletteVariants}</span></span>
        <span className="whitespace-nowrap">tool <span className="text-sky-300">{tool}</span></span>
        {(mirrorX || mirrorZ) && (
          <span className="whitespace-nowrap text-pink-300">対称 {mirrorX ? "X" : ""}{mirrorZ ? "Z" : ""}</span>
        )}
        {issueCount > 0 ? (
          <span className="flex items-center gap-1 whitespace-nowrap text-amber-300">
            <AlertTriangle className="h-3 w-3" /> 未登録/不正ID {issueCount}
          </span>
        ) : stats.nonAir > 0 ? (
          <span className="flex items-center gap-1 whitespace-nowrap text-emerald-500/80">
            <ShieldCheck className="h-3 w-3" /> ID OK
          </span>
        ) : null}
        {hoverPos && <span className="whitespace-nowrap">pos <span className="text-white">[{hoverPos.join(",")}]</span></span>}
        <span className="flex-1" />
        <span className="hidden whitespace-nowrap xl:inline">B:ブラシ E:消しゴム F:塗り I:スポイト Q:選択 R/M/N:回転・反転 X/Z:対称 Ctrl+Z</span>
        <span className="flex items-center gap-1 whitespace-nowrap" title="このブラウザに自動保存されています">
          <Save className={`h-3 w-3 ${lastSaved ? "text-emerald-500" : "text-zinc-600"}`} />
          {lastSaved ? `自動保存 ${timeLabel(lastSaved)}` : "自動保存 待機中"}
        </span>
        <span className="whitespace-nowrap text-zinc-700">v{APP_VERSION}</span>
      </footer>

      {/* ===== トースト / ビジー ===== */}
      {toast && (
        <div className="pointer-events-none fixed bottom-12 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-lg border border-emerald-700 bg-black/90 px-4 py-2 text-center text-xs font-bold text-emerald-200 shadow-xl backdrop-blur">
          {toast}
        </div>
      )}
      {busy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-800 bg-zinc-950 px-5 py-3 text-sm text-emerald-200">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            {busy}
          </div>
        </div>
      )}

      <LayerEditor
        open={layerEditorOpen}
        structure={structure}
        y={layerY}
        selectedBlock={selectedBlock}
        mirrorLabel={[mirrorX && "X", mirrorZ && "Z"].filter(Boolean).join("・")}
        onClose={() => setLayerEditorOpen(false)}
        onYChange={setLayerY}
        onStroke={handleLayerStroke}
        onFillLayer={handleFillLayer}
      />

      <CustomBlockModal
        open={customModal.open}
        initialId={customModal.id}
        blocks={customBlocks}
        onClose={() => setCustomModal({ open: false, id: null })}
        onSave={updateCustomBlocks}
        onToast={showToast}
      />

      <WelcomeModal
        open={welcomeOpen}
        version={APP_VERSION}
        onClose={(dontShowAgain) => {
          setWelcomeOpen(false);
          if (dontShowAgain) {
            try {
              localStorage.setItem(WELCOME_KEY, "1");
            } catch {
              /* noop */
            }
          }
        }}
        onPickSample={() => setSamplesOpen(true)}
        onNew={() => handleNewCanvas([16, 16, 16])}
        onOpenFile={openAnyFile}
      />

      {/* ===== 新規 / サンプル ===== */}
      {samplesOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSamplesOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-emerald-800/60 bg-zinc-950 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black text-white">
                <Sparkles className="h-4 w-4 text-amber-400" /> 新規作成・サンプル
              </h2>
              <button onClick={() => setSamplesOpen(false)} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white" aria-label="閉じる">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 p-3">
              <div className="mb-2 text-[13px] font-bold text-zinc-200">＋ 空から作る</div>
              <div className="flex flex-wrap items-end gap-2">
                {(["X", "Y", "Z"] as const).map((axis, i) => (
                  <label key={axis} className="block">
                    <span className="mb-0.5 block text-center font-mono text-[10px] text-zinc-500">{axis}</span>
                    <input
                      type="number" min={1} max={MAX_SIZE} value={newSize[i]}
                      onChange={(e) => {
                        const n = [...newSize] as Vec3;
                        n[i] = Math.max(1, Math.min(MAX_SIZE, Number(e.target.value) || 1));
                        setNewSize(n);
                      }}
                      className="w-16 rounded-md border border-zinc-700 bg-zinc-900 px-1 py-1 text-center font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </label>
                ))}
                <div className="flex gap-1">
                  {[8, 16, 32, 48].map((n) => (
                    <button key={n} onClick={() => setNewSize([n, n, n])} className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-[10px] text-zinc-400 hover:bg-zinc-800">
                      {n}³
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    handleNewCanvas(newSize);
                    setSamplesOpen(false);
                  }}
                  className="ml-auto rounded-md bg-emerald-600 px-4 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500"
                >
                  作成
                </button>
              </div>
              <div className="mt-1.5 text-[10px] text-zinc-600">最大 {MAX_SIZE}×{MAX_SIZE}×{MAX_SIZE}（ストラクチャーブロックの上限）。現在の構造は履歴に残るので Ctrl+Z で戻せます。</div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {SAMPLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    replaceStructure(s.make(), s.id);
                    setSamplesOpen(false);
                    showToast(`サンプル「${s.ja}」を読み込みました`);
                  }}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-left transition hover:border-emerald-600 hover:bg-emerald-950/30"
                >
                  <div className="text-[13px] font-bold text-white group-hover:text-emerald-200">{s.ja}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-zinc-500">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== ヘルプ ===== */}
      {helpOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setHelpOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-emerald-800/60 bg-zinc-950 p-5 shadow-2xl mc-scroll" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black text-white">
                <Gamepad2 className="h-4 w-4 text-emerald-400" /> 使い方・MOD対応について
              </h2>
              <button onClick={() => setHelpOpen(false)} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white" aria-label="閉じる">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-[12px] leading-relaxed text-zinc-300">
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-white">
                  <FolderOpen className="h-3.5 w-3.5 text-amber-400" /> 基本フロー
                </div>
                <ol className="list-decimal space-y-1 pl-5 text-zinc-400">
                  <li>左からブロックを選ぶ（ID欄に仮IDを直接入力も可）、中央3Dで <span className="text-zinc-200">左クリック=設置 / 右クリック=削除</span></li>
                  <li>箱・球・直線・選択は <span className="text-zinc-200">2点クリック</span>（右クリックで始点取消）。細部は <span className="text-zinc-200">2Dレイヤーエディタ</span> が便利</li>
                  <li>R/M/N で回転・反転、X/Z で対称配置（ステートも自動補正）</li>
                  <li>右パネル「出力」で <span className="text-zinc-200">.nbt</span> またはデータパックzipを書き出し（内部で読み戻し検証）</li>
                  <li>
                    シングル: <span className="font-mono text-zinc-300">saves/ワールド/generated/minecraft/structures/</span> に配置 → ストラクチャーブロック（ロード）で名前指定。
                    データパックなら <span className="font-mono text-zinc-300">/place structure 名前空間:名前</span>
                  </li>
                </ol>
              </div>
              <div className="rounded-lg border border-fuchsia-900/60 bg-fuchsia-950/20 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-fuchsia-300">
                  <Puzzle className="h-3.5 w-3.5" /> MOD・仮IDについて
                </div>
                <ul className="list-disc space-y-0.5 pl-4 text-zinc-400">
                  <li>ブロックIDは <span className="font-mono text-zinc-200">modid:name</span> 形式なら何でも入力可（未登録でも仮IDとして使えます）</li>
                  <li>未登録IDは色がIDから自動生成され、ステート文字列で任意の状態を指定できます</li>
                  <li>「MOD」から表示名・色・プロパティを登録すると、パレットに常時表示されます</li>
                  <li>ID一括リネームで、仮IDを正式IDへ一括差し替え（blockstateは保持）</li>
                  <li>出力時は依存する名前空間をREADMEに自動記載。データパックzipにも同梱</li>
                </ul>
              </div>
              <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-red-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> 注意
                </div>
                <ul className="list-disc space-y-0.5 pl-4 text-zinc-400">
                  <li>対応MODが無い環境で開くと、そのブロックは空気（消失）になります</li>
                  <li>MODブロックのプロパティ名・値はMOD側の定義と一致している必要があります</li>
                  <li>空気の書き出し方で、読込時に既存ブロックを上書きするかが変わります（既定の「省略」は上書きしません）</li>
                  <li>データはこのブラウザ内（localStorage）にのみ保存されます。別PCへは「プロジェクト保存」で持ち運んでください</li>
                </ul>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-white">
                  <FileDown className="h-3.5 w-3.5 text-sky-400" /> ショートカット
                </div>
                <div className="grid grid-cols-2 gap-1 font-mono text-[11px] text-zinc-400">
                  <div><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">B</span> ブラシ</div>
                  <div><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">E</span> 消しゴム</div>
                  <div><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">F</span> 塗りつぶし</div>
                  <div><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">I</span> スポイト</div>
                  <div><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">Q</span> 範囲選択</div>
                  <div><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">R</span> Y軸90°回転</div>
                  <div><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">M / N</span> X / Z反転</div>
                  <div><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">X / Z</span> 対称配置の切替</div>
                  <div><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">Ctrl+Z / Y</span> 元に戻す / やり直し</div>
                  <div><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">Ctrl+C/X/V</span> コピー/切取/貼付</div>
                  <div><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">Ctrl+A</span> 全体を選択</div>
                  <div><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">Del</span> 選択範囲を消去</div>
                  <div><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">Ctrl+S</span> プロジェクト保存</div>
                  <div><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">Esc</span> 始点取消 / ダイアログを閉じる</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-600">
                <span className="flex items-center gap-1.5">
                  <Braces className="h-3 w-3" /> NBT: palette / blocks / DataVersion / Modified UTF-8 / GZip を自動処理
                </span>
                <span className="font-mono">v{APP_VERSION}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
