"use client";

import "./studio.css";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./components/Icon";
import type { IconName } from "./components/Icon";
import GeneratorPanel from "./components/GeneratorPanel";
import PreviewPanel from "./components/PreviewPanel";
import VariationStrip from "./components/VariationStrip";
import { BladeTab, ColorsTab, ExportTab, FxTab, HiltTab, PresetTab, SpursTab } from "./components/Tabs";
import { VanillaLab, PackBuilderPanel } from "./vanilla";
import { GROUPS } from "./generator/catalog";
import type { GroupId } from "./generator/catalog";
import { useStudio } from "./studio/useStudio";
import { useSwordPreview } from "./studio/useSwordPreview";
import { copyPNG, exportAnimation, exportBatch, exportPNG, exportResourcePack, exportServerItem } from "./studio/exports";

type Tab = "generate" | "vanilla" | "packbuild" | "blade" | "hilt" | "spurs" | "fx" | "colors" | "presets" | "export";
const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "generate", label: "生成", icon: "shuffle" },
  { id: "vanilla", label: "純マイクラ", icon: "pixel" },
  { id: "packbuild", label: "リソパ", icon: "download" },
  { id: "blade", label: "刀身", icon: "sword" },
  { id: "hilt", label: "柄・鍔", icon: "grip" },
  { id: "spurs", label: "装飾", icon: "crystal" },
  { id: "fx", label: "FX", icon: "spark" },
  { id: "colors", label: "配色", icon: "palette" },
  { id: "presets", label: "保存", icon: "layers" },
  { id: "export", label: "出力", icon: "download" },
];
const TAB_GROUPS: Partial<Record<Tab, GroupId[]>> = { blade: ["blade", "finish"], hilt: ["guard", "grip"], spurs: ["attachments"], fx: ["element", "effects"], colors: ["palette"] };

export default function App() {
  const studio = useStudio();
  const { opts, document: doc, recipe, update, generate } = studio;
  const [tab, setTab] = useState<Tab>("generate");
  const [playing, setPlaying] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [exportBusy, setExportBusy] = useState(false);
  const [exports, setExports] = useState<{ url: string; name: string; size: number }[]>([]);
  const { canvasRef, timeRef } = useSwordPreview(opts, playing);

  const actions = useRef({ undo: studio.undo, redo: studio.redo, generate });
  actions.current = { undo: studio.undo, redo: studio.redo, generate };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.repeat || target?.closest("input, textarea, select, [contenteditable=true]")) return;
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (key === "z" || key === "y")) {
        e.preventDefault();
        if (e.shiftKey || key === "y") actions.current.redo(); else actions.current.undo();
      } else if (key === "r" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault(); void actions.current.generate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleLock = (id: GroupId) => studio.changeRecipe({ ...recipe, groups: {
    ...recipe.groups, [id]: { ...recipe.groups[id], mode: recipe.groups[id].mode === "keep" ? "auto" : "keep" },
  } });
  const runExport = async (task: () => void) => {
    if (exportBusy) return;
    setExportBusy(true);
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      task(); studio.notify("書き出しデータを作成しました。");
    } catch (error) { studio.notify(error instanceof Error ? error.message : "書き出しに失敗しました。"); }
    finally { setExportBusy(false); }
  };
  const downloadPNG = () => void runExport(() => {
    const result = exportPNG(opts, doc.name, timeRef.current);
    setExports((previous) => [result, ...previous].slice(0, 6));
  });
  const tabGroups = TAB_GROUPS[tab];

  return (
    <div className="studio">
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-grain" />
        <div className="ambient-grid" />
        <i className="ember" /><i className="ember" /><i className="ember" />
        <i className="ember" /><i className="ember" /><i className="ember" />
      </div>
      <header className="studio-header">
        <a className="brand" href="#workbench" aria-label="AegisBlade Studio ワークベンチ"><span className="brand-mark"><Icon name="sword" size={25} /></span><span className="brand-wordmark">AegisBlade<span>STUDIO</span></span></a>
        <span className="header-caption">PROCEDURAL TEXTURE STUDIO</span>
        <div className="header-actions">
          <div className="history-actions"><button className="tool-button" onClick={studio.undo} disabled={!studio.canUndo} title="元に戻す (Ctrl+Z)" aria-label="元に戻す"><Icon name="undo" size={17} /></button><button className="tool-button" onClick={studio.redo} disabled={!studio.canRedo} title="やり直す (Ctrl+Shift+Z)" aria-label="やり直す"><Icon name="redo" size={17} /></button></div>
          <span className="toolbar-divider" />
          <button className="header-random" onClick={() => void generate()} disabled={studio.generating || studio.allLocked || !studio.seedValid}><Icon name="shuffle" size={16} /><span>ランダム生成</span></button>
          <button className="header-export" onClick={downloadPNG} disabled={exportBusy}><Icon name="download" size={15} /><span>{exportBusy ? "書き出し中" : "PNG 書き出し"}</span></button>
        </div>
      </header>

      <main id="workbench" className="workbench">
        <div className="workspace-heading"><div><div className="workspace-breadcrumb">STUDIO <span>/</span> ITEM TEXTURES</div><h1>Sword workbench<span className="workspace-version">04</span></h1></div><span className={`save-status ${studio.storageError ? "has-error" : ""}`}><i />{studio.storageError ? "ブラウザへの保存ができません" : "このブラウザに自動保存"}</span></div>

        <div className="workspace-grid">
          <div className="preview-column">
            <div className="preview-sticky">
              <PreviewPanel canvasRef={canvasRef} options={opts} name={doc.name} playing={playing} onPlaying={setPlaying}
                update={update} paletteLocked={recipe.groups.palette.mode === "keep"} onPaletteLock={() => toggleLock("palette")}
                onPaletteEdit={() => setTab("colors")} generating={studio.generating} />
              <VariationStrip candidates={studio.candidates} selected={opts} onSelect={studio.applyCandidate} />
              {exports.length > 0 && <section className="recent-exports"><span className="eyebrow">RECENT EXPORTS</span><div>{exports.map((item, i) => <a key={`${item.name}-${i}`} href={item.url} download={item.name} title={item.name}><img src={item.url} alt={item.name} /><span>{item.size}px</span></a>)}</div></section>}
            </div>
          </div>

          <aside className="studio-controls">
            <div className="workspace-tabs" role="tablist" aria-label="編集ツール">{TABS.map((t) => <button key={t.id} id={`tab-${t.id}`} role="tab" aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} tabIndex={tab === t.id ? 0 : -1} onClick={() => setTab(t.id)} onKeyDown={(e) => {
              if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
              e.preventDefault();
              const index = TABS.findIndex((item) => item.id === tab);
              const next = e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (index + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
              setTab(TABS[next].id); globalThis.document.getElementById(`tab-${TABS[next].id}`)?.focus();
            }}><Icon name={t.icon} size={15} /><span>{t.label}</span></button>)}</div>

            <div key={tab} id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="editor-panel panel-enter">
              {tabGroups && <div className="manual-locks"><span>次のランダム生成で保持</span><div>{tabGroups.map((id) => <button key={id} aria-pressed={recipe.groups[id].mode === "keep"} className={recipe.groups[id].mode === "keep" ? "active" : ""} onClick={() => toggleLock(id)}><Icon name={recipe.groups[id].mode === "keep" ? "lock" : "unlock"} size={12} />{GROUPS[id].label}</button>)}</div></div>}
              {tab === "generate" && <GeneratorPanel options={opts} recipe={recipe} onChange={studio.changeRecipe}
                onGenerate={(scope, count) => void generate(scope, count)} onReset={studio.resetRecipe} busy={studio.generating}
                report={doc.report} fixedSeed={studio.fixedSeed} onFixedSeed={studio.setFixedSeed}
                seedInput={studio.seedInput} onSeedInput={studio.setSeedInput} seedValid={studio.seedValid} />}
              {tab === "vanilla" && <VanillaLab onApplyToStudio={(patch) => { update(patch); setTab("blade"); studio.notify("バニラの見た目をスタジオへ転送しました。"); }} />}
              {tab === "packbuild" && <PackBuilderPanel currentOptions={opts} currentName={doc.name} customPresets={studio.customPresets} />}
              {tab === "blade" && <BladeTab opts={opts} update={update} />}
              {tab === "hilt" && <HiltTab opts={opts} update={update} />}
              {tab === "spurs" && <SpursTab opts={opts} update={update} />}
              {tab === "fx" && <FxTab opts={opts} update={update} />}
              {tab === "colors" && <ColorsTab opts={opts} update={update} setPaletteField={studio.setPaletteField} onRoll={() => void generate(["palette"])} locked={recipe.groups.palette.mode === "keep"} />}
              {tab === "presets" && <><p className="preset-replace-note"><Icon name="info" size={13} />プリセットは全体を置き換えます。固定はランダム生成にのみ適用されます。</p><PresetTab opts={opts} update={update} currentPresetKey={doc.presetKey} applyPreset={studio.applyPreset} customPresets={studio.customPresets} applyCustom={studio.applyCustom} deleteCustom={studio.deleteCustom} /></>}
              {tab === "export" && <ExportTab opts={opts} name={doc.name} setName={studio.setName} customTier={doc.tier} setCustomTier={studio.setTier} actions={{
                downloadPNG,
                downloadZip: () => void runExport(() => exportResourcePack(opts, doc.name, timeRef.current)),
                downloadServerItem: (cfg) => void runExport(() => exportServerItem(opts, doc.name, timeRef.current, cfg)),
                downloadSprite: (count) => void runExport(() => exportAnimation(opts, doc.name, count)),
                copyPng: async () => { await copyPNG(opts, timeRef.current); },
                exportAllSizes: () => void runExport(() => exportBatch(opts, doc.name, timeRef.current)),
                saveCustomPreset: studio.saveCustom, isCustomSaved: studio.isCustomSaved,
              }} />}
            </div>
          </aside>
        </div>

        <footer className="studio-footer"><span>Made to be yours.</span><p>オリジナルの手続き生成テクスチャ。すべての処理はブラウザ内で完結します。</p><span><kbd>R</kbd> 生成 <span className="footer-separator">/</span> <kbd>Ctrl Z</kbd> 元に戻す</span></footer>
      </main>
      {studio.message && <div className="studio-toast" role="status"><Icon name="info" size={16} /><span>{studio.message}</span><button onClick={() => studio.notify("")} aria-label="通知を閉じる"><Icon name="close" size={14} /></button></div>}
    </div>
  );
}