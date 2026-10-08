"use client";

import "./studio.css";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Dices, Keyboard, Pin, PinOff, Star, Undo2, WandSparkles } from "lucide-react";
import { ELEMENTS, RARITIES, STAFF_TYPES, type Config, type StaffTypeId } from "./engine/data";
import { CATEGORY_LABELS } from "./engine/labels";
import { applyType, autoGenerate } from "./engine/generator";
import { frameToCanvas, renderFrame, renderSheet } from "./engine/render";
import { buildResourcePack, buildServerCollectionPack, type PackOptions, type ServerPackItem } from "./engine/pack";
import { evolutionSeries } from "./engine/evolution";
import { useAtelier } from "./state/useAtelier";
import { MASTERPIECES, type Masterpiece } from "./state/masterpieces";
import { BACKGROUNDS, SHORTCUTS, TABS, TAB_TO_CATEGORY, type Bg, type Tab } from "./state/viewPrefs";
import { useFrameCache } from "./components/Preview";
import {
  Dossier, FavoriteRail, HistoryRail, InGamePreview, LineageStrip, MasterpieceBar, SideInfo, StageView, VariationGrid,
} from "./components/Showcase";
import { ColorPanel, EffectPanel, HeadPanel, IdentityPanel, ShaftPanel } from "./components/panels/DesignPanels";
import { ExportPanel } from "./components/panels/ExportPanel";

const download = (href: string, filename: string) => {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
};

const OPENING = MASTERPIECES[0].build();

export default function App() {
  const atelier = useAtelier(OPENING);
  const { config, commit, generate, locks, setLocks, setLockMode, lockedOnly, lockedKeepCount, notify, toasts, pack } = atelier;

  const [tab, setTab] = useState<Tab>("identity");
  const [masterpieceId, setMasterpieceId] = useState(MASTERPIECES[0].id);
  const [playing, setPlaying] = useState(true);
  const [background, setBackground] = useState<Bg>("checker");
  const [showEmissive, setShowEmissive] = useState(false);
  const [variationSeed, setVariationSeed] = useState(1);
  const [variationCount, setVariationCount] = useState(8);
  const [collection, setCollection] = useState<ServerPackItem[]>([]);
  const [packing, setPacking] = useState(false);
  const [packError, setPackError] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);

  const deferred = useDeferredValue(config);
  const cache = useFrameCache(deferred);
  const emissiveCache = useFrameCache(deferred, "emissive");

  const element = ELEMENTS[config.element];
  const rarity = RARITIES[config.rarity];
  const currentCategory = TAB_TO_CATEGORY[tab];

  const variations = useMemo(
    () => Array.from({ length: variationCount }, (_, index) => ({
      ...autoGenerate(deferred, { seed: variationSeed * 7919 + index * 104729 + 13, locks }),
      size: 64 as const,
      frames: 1,
    })),
    [deferred, locks, variationSeed, variationCount],
  );

  const lineage = useMemo(
    () => evolutionSeries({ ...deferred, size: 64, frames: 1 }).map((stage) => ({ ...stage, config: { ...stage.config, size: 64 as const, frames: 1 } })),
    [deferred],
  );

  const typeThumbs = useMemo(
    () => (Object.keys(STAFF_TYPES) as StaffTypeId[]).map((type) => [
      type,
      applyType({ ...deferred, size: 32, frames: 1, floater: "none", magicCircle: false, particles: 0, rays: false, aura: false }, type),
    ] as const),
    // Only the properties that change a 32px silhouette matter here.
    [deferred.coreColor, deferred.energyColor, deferred.glow, deferred.outline, deferred.rimLight, deferred.dither, deferred.aa, deferred.specular, deferred.finish], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const adopt = useCallback((next: Config) => {
    setMasterpieceId("");
    commit((prev) => ({ ...next, size: prev.size, frames: prev.frames, frametime: prev.frametime }));
  }, [commit]);

  const selectMasterpiece = useCallback((piece: Masterpiece) => {
    setMasterpieceId(piece.id);
    commit((prev) => ({ ...piece.build(), size: prev.size, frames: prev.frames, frametime: prev.frametime }));
  }, [commit]);

  const addLineage = useCallback(() => {
    setCollection((items) => {
      const start = Math.max(pack.customModelData, ...items.map((entry) => entry.customModelData + 1), 1);
      return [...items, ...evolutionSeries(config).map((stage, index) => ({
        config: stage.config, itemId: pack.itemId || "blaze_rod", customModelData: start + index,
        textureId: `${config.type}_${config.element}_stage_${start + index}`, evolutionStage: index,
      }))];
    });
    setTab("export");
    notify("進化4段階をコレクションに追加しました");
  }, [config, notify, pack.customModelData, pack.itemId]);

  const fileBase = `${config.type}_${config.element}_${config.rarity}_${config.size}`;

  const exportTexture = useCallback((kind: "png" | "sheet" | "json", scale: number) => {
    if (kind === "png") {
      download(frameToCanvas(renderFrame(config, 0), scale).toDataURL("image/png"), `spellforge_${fileBase}_x${scale}.png`);
      notify(`PNG を書き出しました（${config.size * scale}px）`);
      return;
    }
    if (kind === "sheet") {
      if (config.frames <= 1) { notify("アニメーションが静止画です", "warn"); return; }
      download(renderSheet(config, 1).toDataURL("image/png"), `spellforge_${fileBase}.png`);
      const meta = JSON.stringify({ animation: { frametime: config.frametime, interpolate: pack.interpolate } }, null, 2);
      window.setTimeout(() => download(URL.createObjectURL(new Blob([meta], { type: "application/json" })), `spellforge_${fileBase}.png.mcmeta`), 220);
      notify(`アニメシート ${config.frames}f を書き出しました`);
      return;
    }
    download(URL.createObjectURL(new Blob([JSON.stringify({ ...config, locks }, null, 2)], { type: "application/json" })), `spellforge_${fileBase}.json`);
    notify("設定JSONを保存しました");
  }, [config, fileBase, locks, notify, pack.interpolate]);

  const packOptions: PackOptions = useMemo(() => ({
    version: pack.version as PackOptions["version"],
    target: pack.target,
    itemId: pack.itemId || "blaze_rod",
    namespace: pack.namespace || "spellforge",
    customModelData: pack.customModelData,
    emissive: pack.emissive,
    lang: pack.lang,
    model: pack.model,
    interpolate: pack.interpolate,
  }), [pack]);

  const exportPack = useCallback(async () => {
    setPacking(true);
    setPackError("");
    try {
      const blob = await buildResourcePack(config, packOptions);
      download(URL.createObjectURL(blob), `spellforge_${packOptions.target}_${packOptions.itemId}_mc${pack.version}.zip`);
      notify("リソースパックZIPを書き出しました");
    } catch (error) {
      setPackError((error as Error).message);
      notify("パック生成に失敗しました", "warn");
    } finally {
      setPacking(false);
    }
  }, [config, notify, pack.version, packOptions]);

  const exportCollection = useCallback(async (mode: "vanilla" | "cit") => {
    if (!collection.length) return;
    setPacking(true);
    setPackError("");
    try {
      const blob = await buildServerCollectionPack(collection, { ...packOptions, target: mode });
      download(URL.createObjectURL(blob), `spellforge_${pack.namespace}_${mode}_collection.zip`);
      notify(`${collection.length}点のサーバーパックを書き出しました`);
    } catch (error) {
      setPackError((error as Error).message);
      notify("コレクション生成に失敗しました", "warn");
    } finally {
      setPacking(false);
    }
  }, [collection, notify, pack.namespace, packOptions]);

  // Keyboard shortcuts, ignored while typing in a field.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) atelier.redo(); else atelier.undo();
        return;
      }
      if (meta) return;
      switch (event.key.toLowerCase()) {
        case "g": event.preventDefault(); generate(); break;
        case "f": event.preventDefault(); atelier.toggleFavorite(); break;
        case "e": setShowEmissive((value) => !value); break;
        case " ": event.preventDefault(); setPlaying((value) => !value); break;
        case "?": setShowShortcuts((value) => !value); break;
        default: {
          const index = Number(event.key);
          if (index >= 1 && index <= TABS.length) setTab(TABS[index - 1][0]);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [atelier, generate]);

  const panels: Record<Tab, React.ReactNode> = {
    identity: <IdentityPanel atelier={atelier} typeThumbs={typeThumbs} />,
    shaft: <ShaftPanel atelier={atelier} />,
    head: <HeadPanel atelier={atelier} />,
    colors: <ColorPanel atelier={atelier} />,
    fx: <EffectPanel atelier={atelier} />,
    export: (
      <ExportPanel
        atelier={atelier} collection={collection} setCollection={setCollection} variations={variations}
        packing={packing} packError={packError}
        onExportTexture={exportTexture} onExportPack={exportPack} onExportCollection={exportCollection}
      />
    ),
  };

  return (
    <div className="app" style={{ ["--live" as string]: config.energyColor, ["--rc" as string]: rarity.color }}>
      <div className="ambient" aria-hidden="true">
        <span className="amb-grid" /><span className="amb-motes" /><span className="amb-vig" />
      </div>

      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true"><WandSparkles size={15} /></span>
          <div className="brand-text">
            <b>SPELLFORGE</b>
            <small>ARCANE HAUTE-ATELIER · MINECRAFT TEXTURE STUDIO</small>
          </div>
        </div>

        <div className="top-status" aria-hidden="true">
          <span className="ts-cell"><i style={{ background: element.core }} />{element.label}</span>
          <span className="ts-cell">{STAFF_TYPES[config.type].label}</span>
          <span className="ts-cell" style={{ color: rarity.color }}>{rarity.label}</span>
        </div>

        <div className="top-actions">
          <div className="ta-history">
            <button onClick={atelier.undo} disabled={!atelier.past.length} title="元に戻す (Ctrl+Z)" aria-label="元に戻す"><Undo2 size={14} /></button>
            <button onClick={atelier.redo} disabled={!atelier.future.length} title="やり直す (Ctrl+Shift+Z)" aria-label="やり直す"><Undo2 size={14} className="flip" /></button>
          </div>
          <button
            className={atelier.isFavorite ? "btn-icon on" : "btn-icon"}
            onClick={atelier.toggleFavorite}
            title={atelier.isFavorite ? "お気に入りから外す (F)" : "お気に入りに保存 (F)"}
            aria-label="お気に入り"
          >
            <Star size={15} />
          </button>
          {lockedOnly && <span className="badge badge-only"><Pin size={11} />{CATEGORY_LABELS[lockedOnly]}のみ変化</span>}
          {lockedKeepCount > 0 && !lockedOnly && <span className="badge badge-keep">{lockedKeepCount}項目を固定中</span>}
          <button className="btn-gen" onClick={generate} title="生成 (G)">
            <Dices size={15} /><span>{lockedOnly ? "指定箇所を再生成" : "おまかせ宝飾生成"}</span>
          </button>
          <button className="btn-icon" onClick={() => setShowShortcuts((value) => !value)} title="ショートカット一覧" aria-label="ショートカット"><Keyboard size={15} /></button>
        </div>
      </header>

      <main className="layout">
        <aside className="panel">
          <nav className="tabs" aria-label="設定カテゴリ">
            {TABS.map(([id, label], index) => (
              <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
                {label}<sup>{index + 1}</sup>
              </button>
            ))}
          </nav>

          <div className="lock-bar">
            <span className="lock-bar-label">{CATEGORY_LABELS[currentCategory]}</span>
            <button
              className={locks[currentCategory] === "keep" ? "lock-btn keep on" : "lock-btn keep"}
              onClick={() => setLockMode(currentCategory, locks[currentCategory] === "keep" ? null : "keep")}
              title="この項目を今の値で固定"
            >
              <PinOff size={12} />{locks[currentCategory] === "keep" ? "固定中" : "固定"}
            </button>
            <button
              className={locks[currentCategory] === "only" ? "lock-btn only on" : "lock-btn only"}
              onClick={() => setLockMode(currentCategory, locks[currentCategory] === "only" ? null : "only")}
              title="他をすべて固定してここだけ変化"
            >
              <Pin size={12} />{locks[currentCategory] === "only" ? "ここだけ" : "ここだけ変化"}
            </button>
            {Object.keys(locks).length > 0 && <button className="lock-btn clear" onClick={() => { setLocks({}); notify("ロックを解除しました", "info"); }}>解除</button>}
          </div>

          <div className="panel-body">{panels[tab]}</div>
        </aside>

        <section className="stage-col">
          <MasterpieceBar pieces={MASTERPIECES} activeId={masterpieceId} onSelect={selectMasterpiece} />
          <HistoryRail atelier={atelier} />
          <Dossier config={config} />

          <div className="stage-head">
            <div className="bg-switch" role="group" aria-label="プレビュー背景">
              {BACKGROUNDS.map(([id, label]) => (
                <button key={id} className={background === id ? "on" : ""} onClick={() => setBackground(id)}>{label}</button>
              ))}
            </div>
            <div className="spacer" />
            <FavoriteRail favorites={atelier.favorites} onOpen={adopt} onRemove={atelier.removeFavorite} />
            <button className={showEmissive ? "mode-btn on" : "mode-btn"} onClick={() => setShowEmissive((value) => !value)} title="発光マップ表示 (E)">
              {showEmissive ? "✦ 発光マップ表示中" : "✧ 発光マップ (_e)"}
            </button>
            <span className="hint-text">{config.frames > 1 ? "ANIMATED" : "STATIC"}</span>
            <button className="icon" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "停止" : "再生"}>{playing ? "❚❚" : "▶"}</button>
          </div>

          <div className="stage-wrap">
            <StageView config={config} cache={cache} emissiveCache={emissiveCache} showEmissive={showEmissive} playing={playing} bg={background} revision={atelier.revision} />
            <SideInfo config={config} cache={cache} emissiveCache={emissiveCache} showEmissive={showEmissive} playing={playing} bg={background} revision={atelier.revision} />
          </div>

          <InGamePreview config={config} cache={cache} playing={playing} variations={variations} />
          <LineageStrip stages={lineage} onAdopt={adopt} onAddAll={addLineage} />
          <VariationGrid
            variations={variations} seed={variationSeed} count={variationCount}
            lockedOnly={lockedOnly} lockedKeepCount={lockedKeepCount}
            onCountChange={setVariationCount} onReseed={() => setVariationSeed((value) => value + 1)} onAdopt={adopt}
          />

          <footer className="atelier-footer">
            <span>SPELLFORGE ATELIER</span>
            <span className="af-rule" />
            <span>{Object.keys(STAFF_TYPES).length} TYPES · {Object.keys(ELEMENTS).length} ELEMENTS · PROCEDURAL PIXEL FORGE</span>
            <span className="af-rule" />
            <button onClick={() => { atelier.resetAll(); setMasterpieceId(""); }}>初期状態へ</button>
          </footer>
        </section>
      </main>

      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => <div key={toast.id} className={`toast tone-${toast.tone}`}>{toast.text}</div>)}
      </div>

      {showShortcuts && (
        <div className="shortcut-sheet" role="dialog" aria-label="キーボードショートカット" onClick={() => setShowShortcuts(false)}>
          <div className="ss-card" onClick={(event) => event.stopPropagation()}>
            <h2>キーボードショートカット</h2>
            <dl>{SHORTCUTS.map(([key, label]) => <div key={key}><dt><kbd>{key}</kbd></dt><dd>{label}</dd></div>)}</dl>
            <p className="ss-note">入力欄にフォーカスがある間は無効になります。</p>
            <button className="btn-pack" onClick={() => setShowShortcuts(false)}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}


