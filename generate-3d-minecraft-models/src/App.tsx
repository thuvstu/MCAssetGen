import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type ReactNode,
} from "react";
import { PixelEditor } from "./components/PixelEditor";
import { Viewport3D } from "./components/Viewport3D";
import type {
  AnimationPresetId,
  DisplayPresetId,
  ExportFormatId,
  GeneratedModel,
  GeneratorConfig,
  GeneratorStyle,
  GreedyMode,
  GroupingMode,
  PresetItem,
  StudioTab,
  TextureInput,
} from "./types/model";
import { buildModelFromTexture, safeFileName } from "./utils/modelBuilder";
import { createTextureFromPreset, PRESET_ITEMS } from "./utils/presets";
import {
  CONCRETE_16,
  DYE_16,
  type DitherMode,
} from "./utils/quantize";
import {
  buildBedrockPack,
  buildJavaPack,
  buildPackTree,
  packTotalSize,
  zipPackFiles,
  type PackKind,
  type PackFile,
  type PackTarget,
  type PackTreeNode,
} from "./utils/pack";
import type { ColorMode, CornerStyle } from "./types/model";

interface Notice {
  message: string;
  type: "success" | "error";
}

interface RecentExport {
  id: string;
  name: string;
  format: ExportFormatId;
  date: string;
  size: string;
  contents: string;
  mimeType: string;
}

const STYLE_OPTIONS: { id: GeneratorStyle; label: string; note: string }[] = [
  { id: "voxel", label: "均一ボクセル", note: "全ピクセルを同じ厚みに" },
  { id: "relief", label: "明度レリーフ", note: "明るい色ほど厚く" },
  { id: "dome", label: "ドーム", note: "輪郭から中心を持ち上げる" },
  { id: "blade", label: "センターリッジ", note: "中央に稜線をつくる" },
  { id: "terraced", label: "階層テラス", note: "色の明度を段差に変換" },
];

const RESOLUTIONS = [16, 32, 64];

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  let content: ReactNode;
  switch (name) {
    case "upload":
      content = <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v4h16v-4" /></>;
      break;
    case "download":
      content = <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 18v3h16v-3" /></>;
      break;
    case "cube":
      content = <><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="M3 7v10l9 5 9-5V7" /><path d="M12 12v10" /></>;
      break;
    case "texture":
      content = <><rect x="3" y="3" width="18" height="18" rx="1" /><path d="m3 15 5-5 4 4 4-6 5 7" /><circle cx="8" cy="8" r="1" /></>;
      break;
    case "code":
      content = <><path d="m8 7-5 5 5 5" /><path d="m16 7 5 5-5 5" /><path d="m14 4-4 16" /></>;
      break;
    case "layers":
      content = <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 16 9 5 9-5" /></>;
      break;
    case "copy":
      content = <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>;
      break;
    case "check":
      content = <path d="m5 12 4 4L19 6" />;
      break;
    case "minus":
      content = <path d="M5 12h14" />;
      break;
    case "plus":
      content = <><path d="M12 5v14" /><path d="M5 12h14" /></>;
      break;
    case "reset":
      content = <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" /></>;
      break;
    case "camera":
      content = <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3.5" /></>;
      break;
    case "sun":
      content = <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>;
      break;
    case "clock":
      content = <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>;
      break;
    case "package":
      content = (
        <>
          <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" />
          <path d="M3 7.5 12 12l9-4.5" />
          <path d="M12 12v9" />
          <path d="m7.5 5.2 9 4.6" />
        </>
      );
      break;
    case "folder":
      content = <path d="M3 6h6l2 2.5h10V19H3V6Z" />;
      break;
    case "file":
      content = <><path d="M14 3v5h5" /><path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8L14 3Z" /></>;
      break;
    case "image":
      content = <><rect x="3" y="4" width="18" height="16" rx="1.5" /><path d="m4 17 5-5 4 4 3-2.5 4 3.5" /><circle cx="8.5" cy="9" r="1.3" /></>;
      break;
    case "dither":
      content = (
        <>
          <rect x="3" y="3" width="8" height="8" rx="1" />
          <rect x="13" y="3" width="8" height="8" rx="1" />
          <rect x="3" y="13" width="8" height="8" rx="1" />
          <rect x="13" y="13" width="8" height="8" rx="1" />
        </>
      );
      break;
    case "arrow":
      content = <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>;
      break;
    default:
      content = <><path d="M12 3v18" /><path d="M3 12h18" /></>;
  }
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {content}
    </svg>
  );
}

function PresetSwatch({ item }: { item: PresetItem }) {
  const width = item.pixels[0]?.length ?? 16;
  const height = item.pixels.length;
  return (
    <svg
      className="preset-swatch"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${item.jaTitle} のドット絵`}
      shapeRendering="crispEdges"
    >
      {item.pixels.flatMap((row, y) =>
        [...row].map((key, x) => {
          const fill = item.palette[key];
          return fill ? <rect key={`${x}:${y}`} x={x} y={y} width="1" height="1" fill={fill} /> : null;
        }),
      )}
    </svg>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function displayName(value: string) {
  return value.trim().replace(/[_-]+/g, " ") || "Untitled model";
}

const COLOR_MODES: { id: ColorMode; label: string; note: string }[] = [
  { id: "original", label: "元画像の色を維持", note: "加工なし。撮影テクスチャの質感を残します" },
  { id: "quantize", label: "メディアンカットで削減", note: "Heckbert 1982。任意の色数に圧縮" },
  { id: "dye16", label: "染料 / 羊毛 16色", note: "バニラの羊毛パレットにスナップ" },
  { id: "concrete16", label: "コンクリート 16色", note: "彩度の高い建築用パレット" },
];

const DITHER_MODES: { id: "none" | "bayer" | "floyd"; label: string }[] = [
  { id: "none", label: "ジザリング無し" },
  { id: "bayer", label: "Bayer 8×8（実写向き）" },
  { id: "floyd", label: "Floyd–Steinberg（滑らか）" },
];

const CORNER_MODES: { id: CornerStyle; label: string; note: string }[] = [
  { id: "none", label: "角を維持", note: "ボクセルのまま" },
  { id: "soften", label: "角を薄く", note: "出っ張りの厚みを減らす" },
  { id: "cut", label: "角を落とす", note: "孤立画素と鋭角を除去" },
];

const ALGORITHMS: { name: string; source: string; detail: string }[] = [
  {
    name: "Greedy meshing",
    source: "0fps / greedy-mesher (mikolalysenko)",
    detail: "同一属性の矩形を走査して1キューブへ統合。面数とドローコールを削減",
  },
  {
    name: "Vertex ambient occlusion",
    source: "0fps「Ambient occlusion for Minecraft-like worlds」",
    detail: "ao = side1 && side2 ? 0 : 3 - (side1+side2+corner) を頂点ごとに計算し、対角フリップで帯のズレを補正",
  },
  {
    name: "Median cut quantization",
    source: "Heckbert, SIGGRAPH 1982",
    detail: "RGB空間を最長レンジで再帰分割し、指定色数へ量子化",
  },
  {
    name: "Ordered / error-diffusion dithering",
    source: "Bayer 8×8・Floyd–Steinberg",
    detail: "色圧縮時のグラデーションの破綻を抑制。実写テクスチャの移植に有効",
  },
  {
    name: "Convex corner bevel",
    source: "モルフォロジー処理＋段差減衰",
    detail: "孤立画素の除去と凸角の厚み減衰でシルエットを整流化",
  },
  {
    name: "Resource pack layout",
    source: "Minecraft Wiki / Bedrock 公式ドキュメント",
    detail: "blockstates・models・terrain_texture・manifest の正しい配置で出力",
  },
  {
    name: "Texture hygiene",
    source: "Blockbench / Hytale モデリングガイド",
    detail: "純黒・純白を避け、解像度は 16 の倍数を推奨する慣習をクランプで反映",
  },
];

function PackTree({
  nodes,
  depth,
  selected,
  onSelect,
}: {
  nodes: PackTreeNode[];
  depth: number;
  selected: string | null;
  onSelect: (path: string) => void;
}) {
  return (
    <ul className="pack-tree-level" style={{ paddingLeft: depth === 0 ? 0 : 13 }}>
      {nodes.map((node) => {
        const isFolder = node.children.length > 0;
        return (
          <li key={node.path} className={isFolder ? "pack-tree-folder" : "pack-tree-file"}>
            {isFolder ? (
              <>
                <span className="pack-tree-name">
                  <Icon name="folder" size={12} />
                  {node.name}
                </span>
                <span className="pack-tree-size">{formatBytes(node.size)}</span>
                <PackTree nodes={node.children} depth={depth + 1} selected={selected} onSelect={onSelect} />
              </>
            ) : (
              <button
                type="button"
                className={selected === node.path ? "pack-file-btn is-active" : "pack-file-btn"}
                onClick={() => onSelect(node.path)}
              >
                <Icon name={node.name.endsWith(".png") ? "image" : "file"} size={12} />
                <span>{node.name}</span>
                <small>{formatBytes(node.size)}</small>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function outputLabel(format: ExportFormatId) {
  if (format === "java_json") return "Java モデル JSON";
  if (format === "bedrock_geo") return "Bedrock Geometry";
  if (format === "png") return "PNG テクスチャ";
  return "Blockbench プロジェクト";
}

function downloadFile(contents: string, filename: string, mimeType: string) {
  if (mimeType === "image/png" && contents.startsWith("data:")) {
    const link = document.createElement("a");
    link.href = contents;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const initialPreset = PRESET_ITEMS[0];
  const initialTexture = createTextureFromPreset(initialPreset);
  const [activePresetId, setActivePresetId] = useState(initialPreset.id);
  const [texture, setTexture] = useState<TextureInput>(initialTexture.texture);
  const [depthOverrides, setDepthOverrides] = useState<Map<string, number>>(new Map());
  const [emissiveOverrides, setEmissiveOverrides] = useState<Set<string>>(initialTexture.emissiveSet);
  const [config, setConfig] = useState<GeneratorConfig>({
    modelName: initialPreset.name,
    namespace: "custom",
    resolution: 16,
    style: initialPreset.recommendedStyle,
    extrudeProfile: "symmetric",
    thickness: initialPreset.recommendedThickness,
    alphaThreshold: 12,
    removeCornerBg: false,
    invertRelief: false,
    addOutline: false,
    outlineColor: "#20251f",
    greedyMode: "depth",
    groupingMode: "single",
    displayPreset: initialPreset.recommendedDisplay,
    animationPreset: "none",
    ambientOcclusion: true,
    doubleSided: false,
    colorMode: "original",
    colorCount: 16,
    ditherMode: "bayer",
    ditherStrength: 55,
    clampBroadcast: true,
    cornerStyle: "none",
  });

  const [generated, setGenerated] = useState<GeneratedModel | null>(null);
  const [studioTab, setStudioTab] = useState<StudioTab>("preview");
  const [exportFormat, setExportFormat] = useState<ExportFormatId>("bbmodel");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isBuilding, setIsBuilding] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [recentExports, setRecentExports] = useState<RecentExport[]>([]);
  const [selectedCubeIds, setSelectedCubeIds] = useState<string[]>([]);

  const [yaw, setYaw] = useState(-0.68);
  const [pitch, setPitch] = useState(0.53);
  const [zoom, setZoom] = useState(1.05);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showUVOverlay, setShowUVOverlay] = useState(false);
  const [showAxes, setShowAxes] = useState(false);
  const [lightAngle, setLightAngle] = useState(45);
  const [selectionDepth, setSelectionDepth] = useState(6);
  const [showAO, setShowAO] = useState(true);
  const [packTarget, setPackTarget] = useState<PackTarget>("java");
  const [packKind, setPackKind] = useState<PackKind>("block");
  const [isZipping, setIsZipping] = useState(false);
  const [selectedPackFile, setSelectedPackFile] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const updateConfig = <K extends keyof GeneratorConfig>(key: K, value: GeneratorConfig[K]) => {
    setIsBuilding(true);
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const nextModel = buildModelFromTexture(texture, config, depthOverrides, emissiveOverrides);
        setGenerated(nextModel);
        setSelectedCubeIds((current) => current.filter((id) => nextModel.voxels.some((cube) => cube.id === id)));
      } catch {
        setNotice({ message: "画像を解析できませんでした。別の画像でお試しください。", type: "error" });
      } finally {
        setIsBuilding(false);
      }
    }, 45);
    return () => window.clearTimeout(timer);
  }, [texture, config, depthOverrides, emissiveOverrides]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selectPreset = (presetId: string) => {
    const preset = PRESET_ITEMS.find((item) => item.id === presetId);
    if (!preset) return;
    const presetTexture = createTextureFromPreset(preset);
    setActivePresetId(preset.id);
    setTexture(presetTexture.texture);
    setDepthOverrides(new Map());
    setEmissiveOverrides(presetTexture.emissiveSet);
    setSelectedCubeIds([]);
    setIsBuilding(true);
    setConfig((previous) => ({
      ...previous,
      modelName: preset.name,
      style: preset.recommendedStyle,
      thickness: preset.recommendedThickness,
      displayPreset: preset.recommendedDisplay,
    }));
  };

  const loadImageFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice({ message: "画像ファイルを選択してください。", type: "error" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setNotice({ message: "画像サイズは20MB以下にしてください。", type: "error" });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (image.naturalWidth > 8192 || image.naturalHeight > 8192) {
        setNotice({ message: "縦横8192px以下の画像を選択してください。", type: "error" });
        return;
      }
      const name = file.name.replace(/\.[^.]+$/, "");
      setActivePresetId("");
      setDepthOverrides(new Map());
      setEmissiveOverrides(new Set());
      setSelectedCubeIds([]);
      setIsBuilding(true);
      setTexture({ source: image, width: image.naturalWidth, height: image.naturalHeight, name: file.name });
      setConfig((previous) => ({ ...previous, modelName: safeFileName(name) }));
      setNotice({ message: `${file.name} を読み込みました。`, type: "success" });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setNotice({ message: "画像を開けませんでした。対応形式かご確認ください。", type: "error" });
    };
    image.src = objectUrl;
  };

  const getOutput = (format: ExportFormatId) => {
    if (!generated) return null;
    const baseName = safeFileName(config.modelName);
    if (format === "java_json") {
      return { text: generated.javaJson, filename: `${baseName}.json`, mimeType: "application/json" };
    }
    if (format === "bedrock_geo") {
      return { text: generated.bedrockJson, filename: `${baseName}.geo.json`, mimeType: "application/json" };
    }
    if (format === "png") {
      return { text: generated.textureDataUrl, filename: `${baseName}.png`, mimeType: "image/png" };
    }
    return { text: generated.bbmodelJson, filename: `${baseName}.bbmodel`, mimeType: "application/json" };
  };

  const handleExport = (format = exportFormat) => {
    const output = getOutput(format);
    if (!output) return;
    downloadFile(output.text, output.filename, output.mimeType);
    const historyItem: RecentExport = {
      id: `${Date.now()}-${Math.random()}`,
      name: output.filename,
      format,
      date: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      size: format === "png" ? "PNG" : formatBytes(new Blob([output.text]).size),
      contents: output.text,
      mimeType: output.mimeType,
    };
    setRecentExports((items) => [historyItem, ...items].slice(0, 6));
    setNotice({ message: `${output.filename} を保存しました。`, type: "success" });
  };

  const handleCopyJson = async () => {
    const output = getOutput(exportFormat);
    if (!output || exportFormat === "png") return;
    try {
      await navigator.clipboard.writeText(output.text);
      setNotice({ message: "JSONをクリップボードにコピーしました。", type: "success" });
    } catch {
      const field = document.createElement("textarea");
      field.value = output.text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
      setNotice({ message: "JSONをクリップボードにコピーしました。", type: "success" });
    }
  };

  const handleScreenshot = () => {
    const canvas = viewportCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${safeFileName(config.modelName)}_preview.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const rotateView = useCallback((deltaX: number, deltaY: number) => {
    setYaw((value) => value + deltaX * 0.012);
    setPitch((value) => Math.max(-0.35, Math.min(1.35, value + deltaY * 0.008)));
  }, []);

  const modifyZoom = useCallback((amount: number) => {
    setZoom((value) => Math.max(0.55, Math.min(1.85, Number((value + amount).toFixed(2)))));
  }, []);

  const setCameraPreset = (preset: "iso" | "front" | "side" | "top") => {
    setAutoRotate(false);
    if (preset === "front") {
      setYaw(0);
      setPitch(0.08);
      setZoom(1.05);
    } else if (preset === "side") {
      setYaw(-Math.PI / 2);
      setPitch(0.12);
      setZoom(1.05);
    } else if (preset === "top") {
      setYaw(0);
      setPitch(1.32);
      setZoom(1.05);
    } else {
      setYaw(-0.68);
      setPitch(0.53);
      setZoom(1.05);
    }
  };

  const handleDrop = (event: ReactDragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    loadImageFile(event.dataTransfer.files[0]);
  };

  const updateDepthOverride = (key: string, depth: number | null) => {
    setDepthOverrides((previous) => {
      const next = new Map(previous);
      if (depth === null) next.delete(key);
      else next.set(key, depth);
      return next;
    });
    setIsBuilding(true);
  };

  const toggleEmissive = (key: string, forceState?: boolean) => {
    setEmissiveOverrides((previous) => {
      const next = new Set(previous);
      const shouldEnable = forceState ?? !next.has(key);
      if (shouldEnable) next.add(key);
      else next.delete(key);
      return next;
    });
    setIsBuilding(true);
  };

  const transformPixelOverrides = (
    mode: "flipH" | "flipV" | "rot90",
    width: number,
    height: number,
  ) => {
    const remapKey = (key: string) => {
      const [col, row] = key.split(":").map(Number);
      if (mode === "flipH") return `${width - 1 - col}:${row}`;
      if (mode === "flipV") return `${col}:${height - 1 - row}`;
      return `${height - 1 - row}:${col}`;
    };

    setDepthOverrides((previous) => new Map(
      Array.from(previous, ([key, depth]) => [remapKey(key), depth]),
    ));
    setEmissiveOverrides((previous) => new Set(
      Array.from(previous, (key) => remapKey(key)),
    ));
    setIsBuilding(true);
  };

  const clearPixelOverrides = () => {
    setDepthOverrides(new Map());
    setEmissiveOverrides(new Set());
    setIsBuilding(true);
    setNotice({ message: "ピクセル単位の深度・発光設定をクリアしました。", type: "success" });
  };

  const selectedCubeKeySet = () => {
    const keys = new Set<string>();
    generated?.voxels
      .filter((cube) => selectedCubeIds.includes(cube.id))
      .forEach((cube) => {
        for (let row = cube.row; row < cube.row + cube.rowSpan; row += 1) {
          for (let col = cube.col; col < cube.col + cube.colSpan; col += 1) {
            keys.add(`${col}:${row}`);
          }
        }
      });
    return keys;
  };

  const applySelectionDepth = (depth: number) => {
    const keys = selectedCubeKeySet();
    if (keys.size === 0) return;
    setDepthOverrides((previous) => {
      const next = new Map(previous);
      keys.forEach((key) => next.set(key, depth));
      return next;
    });
    setIsBuilding(true);
  };

  const applySelectionEmissive = (enabled: boolean) => {
    const keys = selectedCubeKeySet();
    if (keys.size === 0) return;
    setEmissiveOverrides((previous) => {
      const next = new Set(previous);
      keys.forEach((key) => {
        if (enabled) next.add(key);
        else next.delete(key);
      });
      return next;
    });
    setIsBuilding(true);
    setNotice({ message: enabled ? "選択したキューブを発光に設定しました。" : "選択したキューブの発光を解除しました。", type: "success" });
  };

  const activeOutput = getOutput(exportFormat);
  const packInput = (previewDataUrl: string) => ({
    modelName: config.modelName,
    namespace: config.namespace,
    friendlyName: displayName(config.modelName),
    kind: packKind,
    javaJson: generated?.javaJson ?? "{}",
    bedrockJson: generated?.bedrockJson ?? "{}",
    textureDataUrl: generated?.textureDataUrl ?? "",
    previewDataUrl,
    textureWidth: generated?.textureWidth ?? 0,
    textureHeight: generated?.textureHeight ?? 0,
    cubeCount: generated?.voxels.length ?? 0,
    reductionPercent: generated?.reductionPercent ?? 0,
  });

  const packFiles = useMemo<PackFile[]>(() => {
    if (!generated) return [];
    return packTarget === "java"
      ? buildJavaPack(packInput(""))
      : buildBedrockPack(packInput(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generated, packTarget, packKind, config.modelName, config.namespace]);

  const packTree = useMemo(() => buildPackTree(packFiles), [packFiles]);
  const activePackFile = packFiles.find((file) => file.path === selectedPackFile) ?? null;

  const handleExportPack = async () => {
    if (!generated) return;
    setIsZipping(true);
    try {
      const preview = viewportCanvasRef.current?.toDataURL("image/png") ?? generated.textureDataUrl;
      const files =
        packTarget === "java"
          ? buildJavaPack(packInput(preview))
          : buildBedrockPack(packInput(preview));
      const blob = await zipPackFiles(files);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFileName(config.modelName)}_${packTarget}_rp.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice({
        message: `${files.length} ファイル / ${packTotalSize(files)} のパックを書き出しました。`,
        type: "success",
      });
    } catch {
      setNotice({ message: "パックの生成に失敗しました。", type: "error" });
    } finally {
      setIsZipping(false);
    }
  };

  const currentResolution = generated
    ? `${generated.textureWidth} × ${generated.textureHeight}`
    : `${config.resolution} × ${config.resolution}`;

  const tabs: { id: StudioTab; label: string; icon: string }[] = [
    { id: "preview", label: "3D プレビュー", icon: "cube" },
    { id: "editor2d", label: "テクスチャ", icon: "texture" },
    { id: "outliner", label: "構造", icon: "layers" },
    { id: "pack", label: "リソースパック", icon: "package" },
    { id: "json", label: "JSON", icon: "code" },
    { id: "history", label: "履歴", icon: "clock" },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand-lockup" href="#top" aria-label="Voxel Forge ホーム">
          <span className="brand-mark" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i /><i />
          </span>
          <span className="brand-copy">
            <span className="brand-name">VOXEL <b>FORGE</b></span>
            <span className="brand-subtitle">ASSET STUDIO</span>
          </span>
        </a>

        <div className="workflow-path" aria-label="制作ワークフロー">
          <span className="workflow-step is-current"><i>01</i> Texture</span>
          <span className="workflow-connector" />
          <span className="workflow-step"><i>02</i> Geometry</span>
          <span className="workflow-connector" />
          <span className="workflow-step"><i>03</i> Export</span>
        </div>

        <div className="topbar-actions">
          <span className="privacy-indicator"><i />この端末内で処理</span>
          <button
            className="pack-quick-btn"
            type="button"
            onClick={() => { setStudioTab("pack"); }}
            disabled={!generated}
            title="リソースパック構成を確認 / ZIP で書き出し"
          >
            <Icon name="package" size={14} />
            <span>RP</span>
          </button>
          <button className="export-button" type="button" onClick={() => handleExport()} disabled={!generated || isBuilding}>
            <Icon name="download" size={15} />
            <span>書き出す</span>
            <small>{exportFormat === "java_json" ? ".JSON" : exportFormat === "bedrock_geo" ? ".GEO.JSON" : exportFormat === "gltf" ? ".GLTF" : ".BBMODEL"}</small>
          </button>
        </div>
      </header>

      <main className="workspace" id="top">
        <aside className="controls-panel">
          <div className="sidebar-heading">
            <div className="section-eyebrow"><span>01</span> SOURCE & SHAPE</div>
            <h1>テクスチャから<br /><em>3Dモデルを。</em></h1>
            <p>ピクセルの色と輪郭を保ったまま、Blockbench用モデルへ。</p>
          </div>

          <section className="sidebar-section preset-section">
            <div className="field-heading">
              <span>プリセット</span>
              <span className="field-caption">START WITH A SAMPLE</span>
            </div>
            <div className="preset-grid">
              {PRESET_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={activePresetId === item.id ? "preset-item is-active" : "preset-item"}
                  onClick={() => selectPreset(item.id)}
                  title={item.description}
                  aria-pressed={activePresetId === item.id}
                >
                  <span className="preset-art"><PresetSwatch item={item} /></span>
                  <span className="preset-name">{item.jaTitle}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="sidebar-section texture-section">
            <div className="field-heading">
              <span>テクスチャ画像</span>
              <span className="field-caption">PNG · JPG · WEBP</span>
            </div>
            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
              onChange={(event) => {
                loadImageFile(event.currentTarget.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              className={`upload-zone ${isDraggingFile ? "is-dragging" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setIsDraggingFile(true); }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleDrop}
            >
              <span className="texture-thumbnail">
                {generated ? <img src={generated.textureDataUrl} alt="" /> : <Icon name="texture" size={21} />}
              </span>
              <span className="upload-copy">
                <strong>{texture.name}</strong>
                <small>{texture.width} × {texture.height} px · 最大 20 MB</small>
              </span>
              <span className="upload-action"><Icon name="upload" size={15} /></span>
            </button>
          </section>

          <section className="sidebar-section geometry-section">
            <div className="section-title-row">
              <div className="field-heading"><span>モデル形状</span></div>
              <span className="field-caption">LIVE PREVIEW</span>
            </div>

            <label className="input-label" htmlFor="model-name">モデル名</label>
            <div className="filename-input">
              <input
                id="model-name"
                value={config.modelName}
                maxLength={48}
                spellCheck={false}
                onChange={(event) => updateConfig("modelName", event.currentTarget.value)}
              />
              <span>.bbmodel</span>
            </div>

            <div className="control-group">
              <div className="field-heading">
                <span>最大辺の解像度</span>
                <span className="field-caption">PIXELS</span>
              </div>
              <div className="resolution-options" role="group" aria-label="最大辺の解像度">
                {RESOLUTIONS.map((resolution) => (
                  <button
                    key={resolution}
                    className={config.resolution === resolution ? "resolution-option is-active" : "resolution-option"}
                    type="button"
                    aria-pressed={config.resolution === resolution}
                    onClick={() => { updateConfig("resolution", resolution); setIsBuilding(true); }}
                  >
                    {resolution}<span>px</span>
                  </button>
                ))}
              </div>
              <p className="helper-copy">
                ブロックは16、エンティティは32以上が定番。上げるほど精密になりますが、その分キューブ数は増えます。
              </p>
            </div>

            <div className="control-group">
              <div className="field-heading">
                <label htmlFor="style-select">立体化スタイル</label>
                <span className="field-caption">GEOMETRY</span>
              </div>
              <select
                id="style-select"
                className="studio-select style-select"
                value={config.style}
                onChange={(event) => { updateConfig("style", event.currentTarget.value as GeneratorStyle); setIsBuilding(true); }}
              >
                {STYLE_OPTIONS.map((style) => <option key={style.id} value={style.id}>{style.label}</option>)}
              </select>
              <p className="helper-copy">{STYLE_OPTIONS.find((style) => style.id === config.style)?.note}</p>
            </div>

            <div className="control-group thickness-group">
              <div className="field-heading">
                <label htmlFor="thickness">厚み</label>
                <span className="thickness-value">{config.thickness}<small> / 12</small></span>
              </div>
              <input
                id="thickness"
                className="thickness-slider"
                type="range"
                min="1"
                max="12"
                value={config.thickness}
                style={{ "--range": `${((config.thickness - 1) / 11) * 100}%` } as CSSProperties}
                onChange={(event) => { updateConfig("thickness", Number(event.currentTarget.value)); setIsBuilding(true); }}
              />
              <div className="slider-labels"><span>薄い</span><span>厚い</span></div>
            </div>
          </section>

          <section className="sidebar-section palette-section">
            <div className="section-title-row">
              <div className="field-heading">
                <span>パレット & 輪郭</span>
              </div>
              <span className="field-caption">QUANTIZE · DITHER · BEVEL</span>
            </div>

            <div className="control-group">
              <div className="field-heading">
                <label htmlFor="color-mode">色数変換</label>
                {generated && generated.appliedPalette.length > 0 && (
                  <span className="applied-tag">{generated.appliedPalette.length}色へ</span>
                )}
              </div>
              <select
                id="color-mode"
                className="studio-select"
                value={config.colorMode}
                onChange={(event) => updateConfig("colorMode", event.currentTarget.value as ColorMode)}
              >
                {COLOR_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>{mode.label}</option>
                ))}
              </select>
              <p className="helper-copy">
                {COLOR_MODES.find((mode) => mode.id === config.colorMode)?.note}
              </p>
              {config.colorMode === "original" && generated && generated.palette.length > 16 && (
                <button
                  className="palette-suggest"
                  type="button"
                  onClick={() => {
                    updateConfig("colorMode", "quantize");
                    updateConfig("colorCount", 16);
                  }}
                >
                  <Icon name="dither" size={13} />
                  現在 {generated.palette.length}色 → 16色に圧縮する
                </button>
              )}
            </div>

            {config.colorMode === "quantize" && (
              <div className="control-group">
                <div className="field-heading">
                  <label htmlFor="color-count">目標色数</label>
                  <span className="thickness-value">{config.colorCount}<small> / 32</small></span>
                </div>
                <input
                  id="color-count"
                  className="thickness-slider"
                  type="range"
                  min={2}
                  max={32}
                  value={config.colorCount}
                  style={{ "--range": `${((config.colorCount - 2) / 30) * 100}%` } as CSSProperties}
                  onChange={(event) => updateConfig("colorCount", Number(event.currentTarget.value))}
                />
              </div>
            )}

            {(config.colorMode === "dye16" || config.colorMode === "concrete16") && (
              <div className="palette-preview-row">
                {(config.colorMode === "dye16" ? DYE_16 : CONCRETE_16).map((hex) => (
                  <i key={hex} style={{ background: hex }} title={hex} />
                ))}
              </div>
            )}

            {generated && generated.appliedPalette.length > 0 && (
              <div className="palette-preview-row is-derived">
                <span className="palette-preview-label">適用済みパレット</span>
                {generated.appliedPalette.slice(0, 24).map((hex) => (
                  <i key={hex} style={{ background: hex }} title={hex} />
                ))}
              </div>
            )}

            <div className="control-group">
              <div className="field-heading">
                <label htmlFor="dither-mode">ジザリング</label>
                <span className="field-caption">{config.ditherStrength}%</span>
              </div>
              <select
                id="dither-mode"
                className="studio-select"
                value={config.ditherMode}
                onChange={(event) => updateConfig("ditherMode", event.currentTarget.value as DitherMode)}
              >
                {DITHER_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>{mode.label}</option>
                ))}
              </select>
              <input
                className="thickness-slider"
                type="range"
                min={0}
                max={100}
                aria-label="ジザリング強度"
                value={config.ditherStrength}
                style={{ "--range": `${config.ditherStrength}%` } as CSSProperties}
                onChange={(event) => updateConfig("ditherStrength", Number(event.currentTarget.value))}
                disabled={config.ditherMode === "none"}
              />
            </div>

            <div className="control-group">
              <div className="field-heading"><span>輪郭の処理</span></div>
              <div className="profile-Segmented">
                {CORNER_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    title={mode.note}
                    className={config.cornerStyle === mode.id ? "is-active" : ""}
                    onClick={() => updateConfig("cornerStyle", mode.id)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={config.clampBroadcast}
                  onChange={(event) => updateConfig("clampBroadcast", event.currentTarget.checked)}
                />
                <span>純黒 / 純白を回避（12〜246へクランプ）</span>
              </label>
            </div>
          </section>

          <details
            className="advanced-settings"
            open={advancedOpen}
            onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
          >
            <summary><span>詳細設定</span><small>UV · MESH · DISPLAY</small></summary>
            <div className="advanced-content">
              <div className="control-group">
                <div className="field-heading"><span>メッシュ最適化</span></div>
                <select
                  className="studio-select"
                  value={config.greedyMode}
                  onChange={(event) => updateConfig("greedyMode", event.currentTarget.value as GreedyMode)}
                >
                  <option value="depth">同じ深度を矩形統合（推奨）</option>
                  <option value="color_depth">同じ色と深度を統合</option>
                  <option value="none">統合なし（ピクセル単位）</option>
                </select>
              </div>
              <div className="control-group">
                <div className="field-heading"><span>Outlinerグループ</span></div>
                <select
                  className="studio-select"
                  value={config.groupingMode}
                  onChange={(event) => updateConfig("groupingMode", event.currentTarget.value as GroupingMode)}
                >
                  <option value="single">すべてを一つのグループに</option>
                  <option value="by_depth">深度レイヤー別</option>
                  <option value="by_color">色別</option>
                </select>
              </div>
              <div className="control-group">
                <div className="field-heading"><span>表示位置</span></div>
                <select
                  className="studio-select"
                  value={config.displayPreset}
                  onChange={(event) => updateConfig("displayPreset", event.currentTarget.value as DisplayPresetId)}
                >
                  <option value="item">標準アイテム</option>
                  <option value="tool">武器・ツール</option>
                  <option value="block">ブロック・置物</option>
                  <option value="shield">シールド</option>
                </select>
              </div>
              <div className="control-group">
                <div className="field-heading"><span>Blockbenchアニメーション</span></div>
                <select
                  className="studio-select"
                  value={config.animationPreset}
                  onChange={(event) => updateConfig("animationPreset", event.currentTarget.value as AnimationPresetId)}
                >
                  <option value="none">なし</option>
                  <option value="idle_float">Idle float</option>
                  <option value="spin_loop">360° spin loop</option>
                  <option value="pulse">Pulse</option>
                </select>
              </div>
              <label className="advanced-range-label" htmlFor="alpha-threshold">
                <span>透過ピクセルのしきい値</span><b>{config.alphaThreshold}%</b>
              </label>
              <input
                id="alpha-threshold"
                className="thickness-slider"
                type="range"
                min="0"
                max="80"
                value={config.alphaThreshold}
                onChange={(event) => updateConfig("alphaThreshold", Number(event.currentTarget.value))}
              />
              <div className="advanced-checks">
                <label><input type="checkbox" checked={config.removeCornerBg} onChange={(event) => updateConfig("removeCornerBg", event.currentTarget.checked)} /> 四隅の背景を透過</label>
                <label><input type="checkbox" checked={config.addOutline} onChange={(event) => updateConfig("addOutline", event.currentTarget.checked)} /> 1pxの輪郭線を追加</label>
                {config.addOutline && <input type="color" value={config.outlineColor} aria-label="輪郭線の色" onChange={(event) => updateConfig("outlineColor", event.currentTarget.value)} />}
                <label><input type="checkbox" checked={config.invertRelief} onChange={(event) => updateConfig("invertRelief", event.currentTarget.checked)} /> 明度レリーフを反転</label>
                <label><input type="checkbox" checked={config.ambientOcclusion} onChange={(event) => updateConfig("ambientOcclusion", event.currentTarget.checked)} /> AO陰影を有効</label>
                <label><input type="checkbox" checked={config.doubleSided} onChange={(event) => updateConfig("doubleSided", event.currentTarget.checked)} /> 両面レンダリング</label>
              </div>
            </div>
          </details>

          <div className="sidebar-footnote"><span className="status-dot" /> 画像はアップロードされず、この端末内で処理されます。</div>
        </aside>

        <section className="studio-panel" aria-label="モデル制作スタジオ">
          <div className="studio-heading">
            <div className="studio-title-group">
              <div className="studio-overline">MODEL STUDIO <span>/</span> BLOCKBENCH PROJECT</div>
              <h2>{displayName(config.modelName)}</h2>
            </div>
            <div className="studio-heading-right">
              {generated && (
                <div className="mesh-stat" aria-live="polite">
                  <span>{generated.activePixelCount}<small>px</small></span>
                  <i>→</i>
                  <span className="mesh-stat-result">{generated.voxels.length}<small>cubes</small></span>
                  {generated.reductionPercent > 0 && <b>−{generated.reductionPercent}%</b>}
                </div>
              )}
              <div className="building-state">{isBuilding ? <><i className="building-spinner" />生成中</> : <><i className="ready-dot" />プレビュー同期済み</>}</div>
            </div>
          </div>

          <div className="studio-tabs" role="tablist" aria-label="スタジオタブ">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={studioTab === tab.id}
                className={studioTab === tab.id ? "studio-tab is-active" : "studio-tab"}
                onClick={() => setStudioTab(tab.id)}
              >
                <Icon name={tab.icon} size={14} />
                {tab.label}
                {tab.id === "editor2d" && depthOverrides.size + emissiveOverrides.size > 0 && <i className="tab-edited-dot" />}
              </button>
            ))}
            <div className="tab-spacer" />
            <div className="tab-export-select">
              <label htmlFor="export-format">書き出し形式</label>
              <select id="export-format" value={exportFormat} onChange={(event) => setExportFormat(event.currentTarget.value as ExportFormatId)}>
                <option value="bbmodel">.bbmodel</option>
                <option value="java_json">Java .json</option>
                <option value="bedrock_geo">Bedrock .geo.json</option>
                <option value="gltf">glTF .gltf</option>
              </select>
            </div>
          </div>

          {studioTab === "preview" && (
            <>
              <div className="viewer-toolbar">
                <div className="camera-presets" aria-label="カメラ視点">
                  <button className="camera-preset is-default" type="button" onClick={() => setCameraPreset("iso")}>アイソメ</button>
                  <button className="camera-preset" type="button" onClick={() => setCameraPreset("front")}>正面</button>
                  <button className="camera-preset" type="button" onClick={() => setCameraPreset("side")}>側面</button>
                  <button className="camera-preset" type="button" onClick={() => setCameraPreset("top")}>上面</button>
                </div>
                <div className="viewport-actions">
                  <button className={showWireframe ? "tool-toggle is-active" : "tool-toggle"} type="button" onClick={() => setShowWireframe((value) => !value)} title="グリーディ統合されたキューブの境界線"><Icon name="cube" size={14} /><span>境界線</span></button>
                  <button className={showGrid ? "tool-toggle is-active" : "tool-toggle"} type="button" onClick={() => setShowGrid((value) => !value)} title="床グリッド"><Icon name="layers" size={14} /><span>グリッド</span></button>
                  <button className={autoRotate ? "tool-toggle is-active" : "tool-toggle"} type="button" onClick={() => setAutoRotate((value) => !value)} title="自動回転"><Icon name="reset" size={14} /><span>自動回転</span></button>
                  <button className={showUVOverlay ? "tool-toggle is-active" : "tool-toggle"} type="button" onClick={() => setShowUVOverlay((value) => !value)} title="選択中キューブのUV"><Icon name="texture" size={14} /><span>UV</span></button>
                  <button className={showAO ? "tool-toggle is-active" : "tool-toggle"} type="button" onClick={() => setShowAO((value) => !value)} title="頂点アンビエントオクルージョン（0fps式）"><Icon name="dither" size={14} /><span>AO</span></button>
                  <button className={showAxes ? "tool-toggle is-active" : "tool-toggle"} type="button" onClick={() => setShowAxes((value) => !value)} title="座標軸"><span className="axis-glyph">XYZ</span><span>軸</span></button>
                  <button className="tool-toggle capture-toggle" type="button" onClick={handleScreenshot} title="プレビューをPNG保存"><Icon name="camera" size={14} /><span>PNG</span></button>
                </div>
              </div>

              <div className="viewer-stage">
                <div className="stage-ambient" aria-hidden="true" />
                {generated?.voxels.length ? (
                  <Viewport3D
                    key={generated.version}
                    pixels={generated.pixels}
                    voxels={generated.voxels}
                    textureWidth={generated.textureWidth}
                    textureHeight={generated.textureHeight}
                    yaw={yaw}
                    pitch={pitch}
                    zoom={zoom}
                    autoRotate={autoRotate}
                    showWireframe={showWireframe}
                    showGrid={showGrid}
                    showUVOverlay={showUVOverlay}
                    showAxes={showAxes}
                    showAO={showAO}
                    lightAngle={lightAngle}
                    selectedCubeIds={selectedCubeIds}
                    onSelectionChange={setSelectedCubeIds}
                    onRotate={rotateView}
                    onZoom={modifyZoom}
                    canvasExportRef={viewportCanvasRef}
                  />
                ) : (
                  <div className="empty-model"><Icon name="cube" size={29} /><strong>モデルを表示できません</strong><span>透過ピクセルのしきい値を調整するか、画像を読み込んでください。</span></div>
                )}
                <div className="viewport-corner top-left"><span>VIEWPORT</span><i /></div>
                <div className="viewport-coordinate" aria-hidden="true"><span>X</span><span>Y</span><span>Z</span></div>
              </div>

              <div className="viewport-bottom-tools">
                <div className="light-control"><Icon name="sun" size={14} /><span>光源</span><input type="range" min="0" max="360" value={lightAngle} aria-label="光源角度" onChange={(event) => setLightAngle(Number(event.currentTarget.value))} /><small>{lightAngle}°</small></div>
                <div className="zoom-tools">
                  <button type="button" aria-label="ズームアウト" onClick={() => modifyZoom(-0.1)}><Icon name="minus" size={13} /></button>
                  <span>{Math.round(zoom * 100)}%</span>
                  <button type="button" aria-label="ズームイン" onClick={() => modifyZoom(0.1)}><Icon name="plus" size={13} /></button>
                  <button className="view-reset" type="button" onClick={() => setCameraPreset("iso")}><Icon name="reset" size={13} /><span>リセット</span></button>
                </div>
              </div>

              {selectedCubeIds.length > 0 && (
                <div className="selection-bar">
                  <span className="selection-count">{selectedCubeIds.length} 個のキューブを選択中</span>
                  <label className="selection-depth">
                    <span>厚み</span>
                    <input type="range" min="1" max="12" value={selectionDepth} aria-label="選択キューブの厚み" onChange={(event) => setSelectionDepth(Number(event.currentTarget.value))} />
                    <b>{selectionDepth}</b>
                    <button type="button" onClick={() => applySelectionDepth(selectionDepth)}>適用</button>
                  </label>
                  <div className="selection-actions">
                    <button type="button" onClick={() => applySelectionEmissive(true)}>発光にする</button>
                    <button type="button" onClick={() => applySelectionEmissive(false)}>発光解除</button>
                    <button type="button" className="clear-selection" onClick={() => setSelectedCubeIds([])}>選択解除</button>
                  </div>
                </div>
              )}

              <div className="model-status-line">
                <div className="model-status-left">
                  <span className="status-strong">{generated?.voxels.length ?? 0}</span> cubes
                  <i />{generated?.groups.length ?? 0} groups
                  <i />{currentResolution} texture
                  <i />{generated?.palette.length ?? 0} colors
                </div>
                <span className="format-tag"><b>B</b> BLOCKBENCH</span>
              </div>
            </>
          )}

          {studioTab === "editor2d" && generated && (
            <PixelEditor
              texture={texture}
              textureWidth={generated.textureWidth}
              textureHeight={generated.textureHeight}
              pixels={generated.pixels}
              palette={generated.palette}
              depthOverrides={depthOverrides}
              emissiveOverrides={emissiveOverrides}
              onUpdateTexture={(nextTexture) => { setTexture(nextTexture); setActivePresetId(""); setIsBuilding(true); }}
              onUpdateDepthOverride={updateDepthOverride}
              onToggleEmissive={toggleEmissive}
              onTransformOverrides={transformPixelOverrides}
              onClearOverrides={clearPixelOverrides}
            />
          )}

          {studioTab === "outliner" && generated && (
            <div className="inspect-workspace">
              <div className="inspect-header-row">
                <div><span className="studio-overline">MODEL REPORT</span><h3>構造と最適化</h3></div>
                <div className="report-summary"><b>{generated.voxels.length}</b> cubes <i /> {generated.reductionPercent}% 削減</div>
              </div>
              <div className="report-grid">
                <section className="report-section validation-section">
                  <div className="report-section-title"><span>互換性チェック</span><small>BUILD CHECK</small></div>
                  {generated.validations.map((item) => (
                    <div className="report-check" key={item.label}>
                      <span className={item.passed ? "check-mark is-pass" : "check-mark is-warn"}><Icon name={item.passed ? "check" : "plus"} size={12} /></span>
                      <div><strong>{item.label}</strong><small>{item.detail}</small></div>
                    </div>
                  ))}
                </section>
                <section className="report-section palette-section">
                  <div className="report-section-title"><span>カラーパレット</span><small>{generated.palette.length} COLORS</small></div>
                  <div className="palette-distribution">{generated.palette.map((entry) => <i key={entry.hex} style={{ width: `${entry.percentage}%`, backgroundColor: entry.hex }} title={`${entry.hex} · ${entry.percentage}%`} />)}</div>
                  <div className="palette-list">{generated.palette.slice(0, 15).map((entry) => <div className="palette-row" key={entry.hex}><i style={{ background: entry.hex }} /><code>{entry.hex}</code><span>{entry.count} px</span><b>{entry.percentage}%</b></div>)}</div>
                </section>
              </div>
              <section className="report-section outliner-section">
                <div className="report-section-title"><span>Blockbench Outliner</span><small>{generated.groups.length} GROUPS · {generated.voxels.length} CUBES</small></div>
                <div className="outliner-list">
                  {generated.groups.map((group) => (
                    <details className="outliner-group" key={group.uuid} open>
                      <summary><i style={{ background: group.colorSwatch }} /><strong>{group.name}</strong><small>{group.cubeCount} cubes</small></summary>
                      <div className="outliner-items">{group.cubes.slice(0, 180).map((cube) => <button key={cube.id} type="button" onClick={() => { setSelectedCubeIds([cube.id]); setStudioTab("preview"); }}><i style={{ background: cube.color }} /><span>{cube.name}</span><small>{cube.colSpan}×{cube.rowSpan} · d{cube.depth}</small></button>)}</div>
                      {group.cubeCount > 180 && <small className="outliner-overflow">残り {group.cubeCount - 180} キューブ</small>}
                    </details>
                  ))}
                </div>
              </section>

              <section className="report-section algorithm-section">
                <div className="report-section-title">
                  <span>採用している手法と出典</span>
                  <small>ENGINE NOTES</small>
                </div>
                <div className="algorithm-list">
                  {ALGORITHMS.map((item) => (
                    <div className="algorithm-row" key={item.name}>
                      <strong>{item.name}</strong>
                      <span>{item.detail}</span>
                      <code>{item.source}</code>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {studioTab === "pack" && (
            <div className="pack-workspace">
              <div className="inspect-header-row">
                <div>
                  <span className="studio-overline">RESOURCE PACK</span>
                  <h3>そのまま配置できるパック構成</h3>
                </div>
                <div className="pack-controls">
                  <div className="pack-segmented" role="group" aria-label="パック対象">
                    <button type="button" className={packTarget === "java" ? "is-active" : ""} onClick={() => { setPackTarget("java"); setSelectedPackFile(null); }}>Java</button>
                    <button type="button" className={packTarget === "bedrock" ? "is-active" : ""} onClick={() => { setPackTarget("bedrock"); setSelectedPackFile(null); }}>Bedrock</button>
                  </div>
                  {packTarget === "java" && (
                    <div className="pack-segmented" role="group" aria-label="アセット種別">
                      <button type="button" className={packKind === "block" ? "is-active" : ""} onClick={() => setPackKind("block")}>ブロック</button>
                      <button type="button" className={packKind === "item" ? "is-active" : ""} onClick={() => setPackKind("item")}>アイテム</button>
                    </div>
                  )}
                  <button className="pack-zip-btn" type="button" onClick={handleExportPack} disabled={!generated || isZipping}>
                    {isZipping ? <><i className="building-spinner" />ZIP 作成中</> : <><Icon name="download" size={14} />ZIP で書き出す（{packFiles.length} ファイル · {packTotalSize(packFiles)}）</>}
                  </button>
                </div>
              </div>

              {generated ? (
                <div className="pack-split">
                  <div className="pack-tree-card">
                    <div className="pack-card-title"><span>FILE TREE</span><small>{packFiles.length} files · {packTotalSize(packFiles)}</small></div>
                    <div className="pack-tree-scroll">
                      <PackTree nodes={packTree} depth={0} selected={selectedPackFile} onSelect={setSelectedPackFile} />
                    </div>
                    <p className="pack-hint">
                      {packTarget === "java"
                        ? ` textures/${packKind}/ 配下にテクスチャ、モデルは models/${packKind}/、ブロックなら blockstates も自動生成しています。`
                        : " manifest.json と models/ 配置済み。ワールド設定で有効化すれば反映されます。"}
                    </p>
                  </div>
                  <div className="pack-viewer">
                    <div className="pack-card-title">
                      <span>{activePackFile ? activePackFile.path : "ファイルを選択"}</span>
                      {activePackFile && <small>{activePackFile.language.toUpperCase()}</small>}
                    </div>
                    {activePackFile?.language === "image" ? (
                      <div className="pack-image-preview">
                        <div className="checkerboard" />
                        <img src={generated.textureDataUrl} alt={activePackFile.path} />
                        <small>プレビューは元テクスチャ（ZIP 内の pack.png は 3D レンダー）</small>
                      </div>
                    ) : activePackFile ? (
                      <div className="pack-text-scroll">
                        <pre><code>{activePackFile.text}</code></pre>
                      </div>
                    ) : (
                      <div className="pack-empty"><Icon name="package" size={22} /><span>左のツリーからファイルを選ぶと中身を確認できます</span></div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-model"><Icon name="package" size={26} /><span>モデルの生成を待っています</span></div>
              )}
            </div>
          )}

          {studioTab === "json" && (
            <div className="json-workspace">
              <div className="json-toolbar">
                <div className="json-file-label"><span className="json-file-mark">{exportFormat === "bbmodel" ? "B" : "{"}</span><span>{activeOutput?.filename ?? "model.bbmodel"}</span></div>
                <div className="json-actions">
                  {exportFormat !== "png" && <button className="copy-button" type="button" onClick={handleCopyJson} disabled={!generated}><Icon name="copy" size={14} />コピー</button>}
                  <button className="copy-button is-primary" type="button" onClick={() => handleExport()} disabled={!generated || isBuilding}><Icon name="download" size={14} />保存</button>
                </div>
              </div>
              <div className="json-scroll"><pre><code>{activeOutput?.text ?? "// モデルの生成を待っています..."}</code></pre></div>
              <div className="json-guide">
                <span className="json-guide-title">読み込み手順</span>
                {exportFormat === "bbmodel" && <ol><li>Blockbench を起動</li><li><b>File → Open Model</b> を選択</li><li>保存した .bbmodel を開く（テクスチャ済み）</li></ol>}
                {exportFormat === "gltf" && <ol><li>Blockbench を起動</li><li><b>File → Import → glTF</b> を選択</li><li>保存した .gltf を開く（テクスチャ内蔵）</li></ol>}
                {exportFormat === "java_json" && <ol><li>書き出した .json を <code>assets/{config.namespace}/models/item/</code> へ配置</li><li>テクスチャタブから <b>.PNG</b> も保存</li><li><code>assets/{config.namespace}/textures/item/{safeFileName(config.modelName)}.png</code> として配置</li></ol>}
                {exportFormat === "bedrock_geo" && <ol><li>書き出した .geo.json をRPの <code>models/entity/</code> へ配置</li><li>テクスチャタブから <b>.PNG</b> も保存</li><li>geometry ID: <code>geometry.{safeFileName(config.modelName)}</code></li></ol>}
                <span className="json-guide-size">{activeOutput && formatBytes(new Blob([activeOutput.text]).size)}</span>
              </div>
              <div className="json-footnote"><span><i />{exportFormat === "bbmodel" ? "テクスチャ内蔵 · Blockbenchでそのまま開けます" : exportFormat === "java_json" ? "JavaモデルJSON · テクスチャPNGも別途必要です" : exportFormat === "gltf" ? "glTF 2.0 · Blockbench / Blender / Unity で読み込み可能" : "Bedrock geometry JSON · テクスチャPNGも別途必要です"}</span><span>{activeOutput && formatBytes(new Blob([activeOutput.text]).size)}</span></div>
            </div>
          )}

          {studioTab === "history" && (
            <div className="history-workspace">
              <div className="inspect-header-row"><div><span className="studio-overline">SESSION FILES</span><h3>書き出し履歴</h3></div><span className="report-summary">このタブを開いている間に保存したファイル</span></div>
              {recentExports.length === 0 ? (
                <div className="history-empty"><Icon name="clock" size={24} /><strong>まだ書き出しはありません</strong><span>書き出したファイルがここに並びます。</span><button type="button" onClick={() => setStudioTab("preview")}>モデルに戻る <Icon name="arrow" size={13} /></button></div>
              ) : (
                <div className="history-list">{recentExports.map((item) => <div className="history-row" key={item.id}><div className="history-format-mark">{item.format === "bbmodel" ? "B" : item.format === "java_json" ? "J" : item.format === "bedrock_geo" ? "G" : "P"}</div><div className="history-row-info"><strong>{item.name}</strong><span>{outputLabel(item.format)} · {item.size}</span></div><time>{item.date}</time><button type="button" onClick={() => downloadFile(item.contents, item.name, item.mimeType)} title="もう一度ダウンロード"><Icon name="download" size={14} /></button></div>)}</div>
              )}
            </div>
          )}

          <div className="studio-footer"><span>VOXEL FORGE <b>·</b> LOCAL GENERATION</span><span>2D TEXTURE <b>→</b> VOXEL GEOMETRY <b>→</b> BLOCKBENCH</span></div>
        </section>
      </main>

      {notice && <div className={`toast toast-${notice.type}`} role="status" aria-live="polite"><span className="toast-mark"><Icon name={notice.type === "success" ? "check" : "plus"} size={14} /></span><span>{notice.message}</span></div>}
    </div>
  );
}