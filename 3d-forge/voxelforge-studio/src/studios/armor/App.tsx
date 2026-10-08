"use client";

import "./studio.css";
import { useCallback, useMemo, useState } from "react";
import JSZip from "jszip";
import { AtlasView } from "./components/AtlasView";
import { CodeView, type CodePreview } from "./components/CodeView";
import { ControlPanel } from "./components/ControlPanel";
import { GeoUvMap } from "./components/GeoUvMap";
import { IconView } from "./components/IconView";
import { Preview3D, type PreviewFocus, type PreviewMode } from "./components/Preview3D";
import { Button, Toggle } from "./components/ui";
import { DEFAULT_PARAMS, PART_LABELS, STYLES, type ArmorParams, type PartId } from "./lib/armorTypes";
import { buildPackage, listFiles, renderGeoGuide, renderUvGuide } from "./lib/exporter";
import { renderAtlas, renderIcons, type RGBA } from "./lib/generator";
import { buildGeoLayout, geoModelJson, renderGeoTexture } from "./lib/geoModel";
import { canvasToBlob, downloadBlob, loadImageAsAtlas, rgbaToCanvas } from "./lib/imageUtils";
import {
  PARTS,
  armorJava,
  equipmentJson,
  geckoItemJava,
  geckoRendererJava,
  itemDefinitionJson,
  itemId,
  itemModelJson,
  langJson,
  readme,
  sanitizeId,
  toPascal,
} from "./lib/templates";

type Tab = "preview" | "atlas" | "icons" | "files";

const TABS: { id: Tab; number: string; label: string }[] = [
  { id: "preview", number: "01", label: "造形プレビュー" },
  { id: "atlas", number: "02", label: "UV アトラス" },
  { id: "icons", number: "03", label: "アイテム" },
  { id: "files", number: "04", label: "出力ファイル" },
];

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const lig = l / 100;
  const a = sat * Math.min(lig, 1 - lig);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const v = lig - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

function BrandMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path d="M18 2 32 10v15L18 34 4 25V10L18 2Z" stroke="#CFA66E" strokeWidth="1.2" />
      <path d="m18 7 9 5v10l-9 6-9-6V12l9-5Z" stroke="#CFA66E" strokeWidth="1.2" />
      <path d="M13 16h10m-5-7v12m-5 1 5 4 5-4" stroke="#F1D6AB" strokeWidth="1.2" />
    </svg>
  );
}

export default function App() {
  const [params, setParams] = useState<ArmorParams>(DEFAULT_PARAMS);
  const [uploads, setUploads] = useState<{ layer1: RGBA | null; layer2: RGBA | null; geo: RGBA | null }>({
    layer1: null,
    layer2: null,
    geo: null,
  });
  const [tab, setTab] = useState<Tab>("preview");
  const [mode, setMode] = useState<PreviewMode>("geo");
  const [focus, setFocus] = useState<PreviewFocus>("helmet");
  const [mannequin, setMannequin] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [hoveredBone, setHoveredBone] = useState<string | null>(null);

  // 造形はヘルメット形状・バイザー・角の長さにだけ依存する
  const layout = useMemo(
    () => buildGeoLayout(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.helmetProfile, params.visorMode, params.hornLength]
  );

  const notify = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(null), 3200);
  }, []);
  const update = useCallback((patch: Partial<ArmorParams>) => {
    setParams((current) => ({ ...current, ...patch }));
  }, []);
  const onBrightness = useCallback((part: PartId, value: number) => {
    setParams((current) => ({ ...current, brightness: { ...current.brightness, [part]: value } }));
  }, []);
  const randomPalette = () => {
    const h = Math.random() * 360;
    update({
      primary: hslToHex(h, 50 + Math.random() * 22, 26 + Math.random() * 18),
      secondary: hslToHex(h, 35 + Math.random() * 20, 9 + Math.random() * 10),
      accent: hslToHex((h + 150) % 360, 75, 65),
      seed: Math.floor(Math.random() * 999999),
    });
  };

  const handleUpload = async (layer: 1 | 2 | "geo", file: File) => {
    try {
      const image =
        layer === "geo"
          ? await loadImageAsAtlas(file, layout.size, layout.size)
          : await loadImageAsAtlas(file, 64, 32);
      setUploads((current) => ({
        ...current,
        [layer === "geo" ? "geo" : layer === 1 ? "layer1" : "layer2"]: image,
      }));
      notify(layer === "geo" ? "Geo用UVアトラスを読み込みました" : "バニラ防具のUV画像を読み込みました");
    } catch (error) {
      notify(error instanceof Error ? error.message : "読み込みに失敗しました");
    }
  };

  const safeParams = useMemo(
    () => ({
      ...params,
      armorId: sanitizeId(params.armorId, "armor"),
      namespace: sanitizeId(params.namespace, "mymod"),
    }),
    [params]
  );

  /* ---------- 生成結果 ---------- */

  const generated1 = useMemo(() => renderAtlas(1, params), [params]);
  const generated2 = useMemo(() => renderAtlas(2, params), [params]);
  const generatedGeo = useMemo(() => renderGeoTexture(params, layout), [params, layout]);
  const atlas1 = uploads.layer1 ?? generated1;
  const atlas2 = uploads.layer2 ?? generated2;
  const geoTexture = uploads.geo ?? generatedGeo;

  const canvas1 = useMemo(() => rgbaToCanvas(atlas1), [atlas1]);
  const canvas2 = useMemo(() => rgbaToCanvas(atlas2), [atlas2]);
  const geoCanvas = useMemo(() => rgbaToCanvas(geoTexture), [geoTexture]);
  const src1 = useMemo(() => canvas1.toDataURL("image/png"), [canvas1]);
  const src2 = useMemo(() => canvas2.toDataURL("image/png"), [canvas2]);
  const geoSrc = useMemo(() => geoCanvas.toDataURL("image/png"), [geoCanvas]);

  const iconImages = useMemo(
    () => renderIcons(atlas1, atlas2, params.iconSize, params),
    [atlas1, atlas2, params]
  );
  const iconUrls = useMemo(() => {
    const urls = {} as Record<PartId, string>;
    for (const part of PARTS) urls[part] = rgbaToCanvas(iconImages[part]).toDataURL("image/png");
    return urls;
  }, [iconImages]);

  const files = useMemo(() => listFiles(safeParams), [safeParams]);
  const previews: CodePreview[] = useMemo(() => {
    const ns = safeParams.namespace;
    const id = safeParams.armorId;
    const cls = toPascal(id);
    const result: CodePreview[] = [
      { label: "EQUIPMENT", path: `assets/${ns}/equipment/${id}.json`, content: equipmentJson(safeParams), lang: "json" },
      { label: "ITEM MODEL", path: `assets/${ns}/models/item/${itemId(safeParams, "helmet")}.json`, content: itemModelJson(safeParams, "helmet"), lang: "json" },
      { label: "ITEM DEF", path: `assets/${ns}/items/${itemId(safeParams, "helmet")}.json`, content: itemDefinitionJson(safeParams, "helmet"), lang: "json" },
      { label: "LANG", path: `assets/${ns}/lang/ja_jp.json`, content: langJson(safeParams, "ja_jp"), lang: "json" },
    ];
    if (safeParams.includeGeckolib) {
      result.push({
        label: "GEO MODEL",
        path: `assets/${ns}/geo/item/armor/${id}.geo.json`,
        content: geoModelJson(safeParams, layout),
        lang: "json",
      });
    }
    if (safeParams.includeJava) {
      result.push({ label: "FABRIC JAVA", path: `java/com/example/${ns}/${cls}Armor.java`, content: armorJava(safeParams), lang: "java" });
      if (safeParams.includeGeckolib) {
        result.push({ label: "GEO ITEM", path: `java/com/example/${ns}/${cls}GeoItem.java`, content: geckoItemJava(safeParams), lang: "java" });
        result.push({ label: "RENDERER", path: `java/com/example/${ns}/${cls}ArmorRenderer.java`, content: geckoRendererJava(safeParams), lang: "java" });
      }
    }
    result.push({ label: "README", path: "README.md", content: readme(safeParams, layout.size), lang: "markdown" });
    return result;
  }, [safeParams, layout]);

  /* ---------- 書き出し ---------- */

  const saveCanvas = async (canvas: HTMLCanvasElement, name: string) => {
    downloadBlob(await canvasToBlob(canvas), name);
  };
  const downloadZip = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const result = await buildPackage(safeParams, atlas1, atlas2, geoTexture, layout);
      downloadBlob(result.blob, `${safeParams.armorId}_armor_assets.zip`);
      notify(`${result.files.length} ファイルを書き出しました`);
    } catch (error) {
      console.error(error);
      notify(error instanceof Error ? error.message : "ZIP の書き出しに失敗しました");
    } finally {
      setExporting(false);
    }
  };
  const downloadIcon = async (part: PartId) =>
    saveCanvas(rgbaToCanvas(iconImages[part]), `${itemId(safeParams, part)}.png`);
  const downloadAllIcons = async () => {
    try {
      const zip = new JSZip();
      for (const part of PARTS) {
        zip.file(`${itemId(safeParams, part)}.png`, await canvasToBlob(rgbaToCanvas(iconImages[part])));
      }
      downloadBlob(await zip.generateAsync({ type: "blob" }), `${safeParams.armorId}_icons.zip`);
    } catch {
      notify("アイコンの書き出しに失敗しました");
    }
  };

  const styleName = STYLES.find((style) => style.id === params.style)?.label ?? "";

  return (
    <div className="min-h-screen bg-[#111513] text-[#e7e5dd]">
      <header className="relative z-20 border-b border-[#363d37] bg-[#171b19]">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-9">
          <div className="flex items-center gap-4">
            <BrandMark />
            <div>
              <div className="font-serif text-[23px] leading-none tracking-[0.075em] text-[#f2e8d5]">ARMOR ATELIER</div>
              <div className="mt-1.5 text-[10px] tracking-[0.11em] text-[#888f84]">MINECRAFT ARMOR ASSET MAKER</div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden font-mono text-[10px] tracking-[0.12em] text-[#9ba093] md:block">JAVA 1.21.11 / FABRIC</span>
            <Button variant="primary" onClick={downloadZip} disabled={exporting} className="px-5 py-2.5">
              {exporting ? "生成中..." : "ZIP を書き出す  ↗"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="custom-scrollbar border-b border-[#363d37] bg-[#202522] lg:sticky lg:top-0 lg:h-[calc(100vh-77px)] lg:overflow-y-auto lg:border-r lg:border-b-0">
          <ControlPanel
            params={params}
            update={update}
            onBrightness={onBrightness}
            onRandomSeed={() => update({ seed: Math.floor(Math.random() * 999999) })}
            onRandomPalette={randomPalette}
            onUpload={handleUpload}
            uploaded={{ layer1: !!uploads.layer1, layer2: !!uploads.layer2, geo: !!uploads.geo }}
            onResetUpload={() => setUploads({ layer1: null, layer2: null, geo: null })}
            onExport={downloadZip}
            exporting={exporting}
          />
        </aside>

        <main className="min-w-0 bg-[#141816]">
          <div className="flex flex-wrap items-center justify-between border-b border-[#363d37] px-5 lg:px-9">
            <nav className="flex flex-wrap gap-6" aria-label="表示の切り替え">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`relative py-5 text-[12px] tracking-[0.04em] transition-colors ${
                    tab === item.id ? "text-[#f4ddbd]" : "text-[#878e83] hover:text-[#e1ddd2]"
                  }`}
                >
                  <span className="mr-2 font-mono text-[9px] text-[#a58052]">{item.number}</span>
                  {item.label}
                  {tab === item.id && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#d7ab73]" />}
                </button>
              ))}
            </nav>
            <div className="hidden text-[10px] text-[#899286] xl:block">
              {safeParams.namespace}:{safeParams.armorId} <span className="mx-2 text-[#656b62]">/</span> {styleName}
            </div>
          </div>

          {tab === "preview" && (
            <div className="animate-appear">
              <div className="forge-stage relative h-[min(73vh,740px)] min-h-[570px] overflow-hidden border-b border-[#353b35]">
                <div className="stage-halo pointer-events-none absolute inset-0" />
                <Preview3D
                  atlas1={canvas1}
                  atlas2={canvas2}
                  geoTexture={geoCanvas}
                  layout={layout}
                  mode={mode}
                  focus={focus}
                  mannequin={mannequin}
                  autoRotate={autoRotate}
                  highlightBone={mode === "geo" ? hoveredBone : null}
                />
                <div className="pointer-events-none absolute top-7 left-6 z-10 max-w-[290px] sm:top-9 sm:left-9">
                  <div className="eyebrow mb-3">01 / THE MODEL STUDY</div>
                  <h1 className="font-serif text-[31px] leading-[1.25] tracking-[0.01em] text-[#efe8d9] sm:text-[38px]">
                    鎧は、輪郭から。
                  </h1>
                  <p className="mt-3 text-[11px] leading-[1.8] text-[#b9bbb2]">
                    {mode === "geo"
                      ? params.includeGeckolib
                        ? "角と面頬まで造形した、書き出し用Geoモデル。"
                        : "Geo造形のプレビュー。現在の設定ではZIPに含めません。"
                      : "64x32のテクスチャだけで描くバニラ表示。角などの立体造形は含まれません。"}
                  </p>
                </div>
                <div className="absolute top-40 right-6 z-10 flex border border-[#777669] bg-[#1a1f1bd9] p-1 backdrop-blur-sm sm:top-8 sm:right-9">
                  {([["geo", "GEO / 立体"], ["vanilla", "VANILLA / UV"]] as [PreviewMode, string][]).map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setMode(value)}
                      className={`px-3 py-2 font-mono text-[10px] tracking-wider transition-colors ${
                        mode === value ? "bg-[#d4a971] text-[#1c1b18]" : "text-[#c1c4b7] hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="absolute bottom-7 left-6 z-10 flex items-center gap-3 sm:bottom-8 sm:left-9">
                  {([["helmet", "ヘルメットを見る"], ["full", "全身を見る"]] as [PreviewFocus, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFocus(value)}
                      className={`border-b pb-2 text-[11px] transition-colors ${
                        focus === value ? "border-[#e1b478] text-[#f4e0bf]" : "border-transparent text-[#9da398] hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="absolute right-6 bottom-6 z-10 flex items-center gap-3 bg-[#1a1e1baa] px-2 py-2 backdrop-blur-sm sm:right-9 sm:gap-5 sm:px-3">
                  <Toggle label="素体" checked={mannequin} onChange={setMannequin} />
                  <Toggle label="回転" checked={autoRotate} onChange={setAutoRotate} />
                </div>
                <div className="pointer-events-none absolute bottom-[82px] left-6 font-mono text-[9px] tracking-wider text-[#858e84] sm:left-9">
                  DRAG TO ROTATE / SCROLL TO ZOOM
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 px-6 py-6 sm:gap-8 lg:px-9">
                <div className="min-w-[126px]">
                  <div className="eyebrow mb-1">INVENTORY STUDY</div>
                  <div className="text-[12px] text-[#e8e3d5]">装備アイコン</div>
                  <p className="mt-1 text-[10px] text-[#838d82]">UVから描く16pxピクセルアート</p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  {PARTS.map((part) => (
                    <button
                      key={part}
                      type="button"
                      onClick={() => setTab("icons")}
                      className="group flex flex-col items-center gap-2 text-[#9ca399] transition-transform hover:-translate-y-1"
                      title={`${PART_LABELS[part]}のアイコンを見る`}
                    >
                      <span className="flex h-[57px] w-[57px] items-center justify-center border border-[#555e53] bg-[#333a35] transition-colors group-hover:border-[#d3ab76]">
                        <img src={iconUrls[part]} alt="" className="h-[43px] w-[43px]" style={{ imageRendering: "pixelated" }} />
                      </span>
                      <span className="text-[10px]">{PART_LABELS[part]}</span>
                    </button>
                  ))}
                </div>
                <div className="ml-auto hidden max-w-[180px] border-l border-[#424840] pl-5 text-[10px] leading-[1.7] text-[#8e978a] 2xl:block">
                  Geo: 装備ボーンと個別UV島<br />Vanilla: 64x32の装備テクスチャ
                </div>
              </div>
            </div>
          )}

          {tab === "atlas" && (
            <div className="animate-appear space-y-12 px-5 py-8 lg:px-9 lg:py-10">
              <section className="space-y-10">
                <div>
                  <div className="eyebrow mb-2">02 / UV WORKSPACE</div>
                  <h2 className="font-serif text-3xl text-[#f1e6d5]">装備の設計図</h2>
                  <p className="mt-2 text-[11px] text-[#9aa195]">バニラ用64×32の2枚。枠線を切り替えて各面を確認できます。</p>
                </div>
                <AtlasView
                  layer={1}
                  src={src1}
                  fromUpload={!!uploads.layer1}
                  onDownloadAtlas={() => saveCanvas(canvas1, `${safeParams.armorId}_humanoid.png`)}
                  onDownloadGuide={() => saveCanvas(renderUvGuide(1, atlas1), `${safeParams.armorId}_uv_guide_humanoid.png`)}
                  onDownloadBlank={() => saveCanvas(renderUvGuide(1, null), `${safeParams.armorId}_uv_blank_humanoid.png`)}
                />
                <AtlasView
                  layer={2}
                  src={src2}
                  fromUpload={!!uploads.layer2}
                  onDownloadAtlas={() => saveCanvas(canvas2, `${safeParams.armorId}_humanoid_leggings.png`)}
                  onDownloadGuide={() => saveCanvas(renderUvGuide(2, atlas2), `${safeParams.armorId}_uv_guide_leggings.png`)}
                  onDownloadBlank={() => saveCanvas(renderUvGuide(2, null), `${safeParams.armorId}_uv_blank_leggings.png`)}
                />
              </section>

              <section className="space-y-7 border-t border-[#41473e] pt-10">
                <div className="flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <div className="eyebrow mb-2">
                      03 / GEO UV ATLAS / {layout.size} x {layout.size}
                    </div>
                    <h2 className="font-serif text-3xl text-[#f1e6d5]">GeckoLib用 UVアトラス</h2>
                    <p className="mt-2 max-w-[600px] text-[11px] leading-relaxed text-[#919a8e]">
                      各キューブを個別の島に展開しています。島にカーソルを置くと、プレビューで対応するボーンが光ります。
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-[#879187]">
                      textures/item/armor/{safeParams.armorId}.png
                      {uploads.geo && <span className="ml-3 text-[#dcba84]">手描きテクスチャを使用中</span>}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => saveCanvas(geoCanvas, `${safeParams.armorId}_geo_texture.png`)}>テクスチャ PNG</Button>
                    <Button variant="secondary" onClick={() => saveCanvas(renderGeoGuide(layout, geoCanvas), `${safeParams.armorId}_geo_uv_guide.png`)}>
                      ガイド付き
                    </Button>
                    <Button variant="ghost" onClick={() => saveCanvas(renderGeoGuide(layout, null), `${safeParams.armorId}_geo_uv_blank.png`)}>
                      白紙テンプレ
                    </Button>
                  </div>
                </div>
                <GeoUvMap layout={layout} src={geoSrc} hovered={hoveredBone} onHover={setHoveredBone} />
              </section>
            </div>
          )}

          {tab === "icons" && (
            <div className="animate-appear px-5 py-8 lg:px-9 lg:py-10">
              <div className="eyebrow mb-2">04 / ITEM TEXTURES</div>
              <h2 className="mb-8 font-serif text-3xl text-[#f1e6d5]">手のひらに収まる鎧</h2>
              <IconView icons={iconUrls} size={params.iconSize} onDownload={downloadIcon} onDownloadAll={downloadAllIcons} />
            </div>
          )}

          {tab === "files" && (
            <div className="animate-appear px-5 py-8 lg:px-9 lg:py-10">
              <div className="eyebrow mb-2">05 / THE PACKAGE</div>
              <h2 className="mb-8 font-serif text-3xl text-[#f1e6d5]">MODに組み込む</h2>
              <CodeView previews={previews} files={files} />
              <p className="mt-7 text-[11px] leading-relaxed text-[#939b90]">
                Javaは1.21.11 / YarnとGeckoLib 5.4系の参考コードです。Web上でJavaのコンパイルやゲーム内表示は検証していません。
              </p>
            </div>
          )}
        </main>
      </div>
      {notice && (
        <div role="status" className="fixed right-5 bottom-5 z-50 border border-[#aa855e] bg-[#262923] px-5 py-3 text-xs text-[#f1dbb8] shadow-2xl">
          {notice}
        </div>
      )}
    </div>
  );
}
