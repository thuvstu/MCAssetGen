import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./ui/Icon";
import { Slider } from "./ui/Slider";
import {
  ANIMATIONS,
  DECORATIONS,
  DEFAULT_EDITOR,
  FORMS,
  MODES,
  PRESETS,
  THEMES,
  TIERS,
  findAnimation,
  findForm,
  findMode,
  findTheme,
  findTier,
} from "./engine/data";
import { composeFrame, createSampleTexture, getDimensions, renderBaseModel, renderTexture, rescaleTexture } from "./engine/render";
import { downloadCanvas, isSupportedImageFile, loadImageFile } from "./engine/io";
import type {
  AnimationId,
  AnimationFrame,
  DecorationId,
  EditorState,
  FormId,
  ModeId,
  ThemeId,
  TierId,
  TextureSource,
} from "./engine/types";

type PanelId = "look" | "model" | "combat";
type SizeMode = "source" | 16 | 32 | 64 | 128;

const SIZES: { value: SizeMode; label: string }[] = [
  { value: "source", label: "原寸" },
  { value: 16, label: "16" },
  { value: 32, label: "32" },
  { value: 64, label: "64" },
  { value: 128, label: "128" },
];

export default function App() {
  const [texture, setTexture] = useState<TextureSource | null>(null);
  const [fileName, setFileName] = useState("diamond_sword.png");
  const [sizeMode, setSizeMode] = useState<SizeMode>("source");
  const [editor, setEditor] = useState<EditorState>(DEFAULT_EDITOR);
  const [compareMode, setCompareMode] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState("");
  const [panel, setPanel] = useState<PanelId>("model");

  const [animation, setAnimation] = useState<AnimationId>("idle");
  const [playing, setPlaying] = useState(true);
  const frameRef = useRef<AnimationFrame>({ animation: "idle", time: 0, progress: 0, playing: true });
  const clockRef = useRef(0);
  const rafRef = useRef(0);

  const modeExpiryRef = useRef(0);
  const modeUiTickRef = useRef(0);
  const [modeRemaining, setModeRemaining] = useState(0);

  const previewRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<EditorState[]>([DEFAULT_EDITOR]);
  const historyIndexRef = useRef(0);
  const [, bump] = useState(0);

  // cached base render (colour + decorations) — recomputed only when settings change
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const baseSigRef = useRef("");

  // working texture honours the selected output size
  const workTexture = useMemo<TextureSource | null>(() => {
    if (!texture) return null;
    return sizeMode === "source" ? texture : rescaleTexture(texture, sizeMode);
  }, [texture, sizeMode]);

  const dimensions = useMemo(
    () => (workTexture ? getDimensions(workTexture) : { width: 32, height: 32 }),
    [workTexture],
  );

  useEffect(() => {
    baseRef.current = null;
    baseSigRef.current = "";
  }, [workTexture]);

  useEffect(() => {
    const sample = createSampleTexture();
    setTexture(sample);
  }, []);

  // main loop
  useEffect(() => {
    if (!workTexture) return;
    const def = findAnimation(animation);
    const signature = JSON.stringify({ e: editor, w: dimensions.width, h: dimensions.height, cmp: compareMode });

    const tick = (now: number) => {
      const time = playing ? now - clockRef.current : frameRef.current.time;
      const progress = def.duration > 0 ? (time % def.duration) / def.duration : 0;
      const frame: AnimationFrame = { animation, time, progress, playing };
      frameRef.current = frame;

      if (modeExpiryRef.current > 0) {
        const left = modeExpiryRef.current - Date.now();
        if (left <= 0) {
          modeExpiryRef.current = 0;
          setModeRemaining(0);
          setEditor((prev) => (prev.mode === "none" ? prev : { ...prev, mode: "none" }));
        } else if (now - modeUiTickRef.current > 100) {
          modeUiTickRef.current = now;
          setModeRemaining(left);
        }
      }

      if (previewRef.current) {
        if (baseSigRef.current !== signature || !baseRef.current) {
          const shown = compareMode ? { ...DEFAULT_EDITOR, accent: editor.accent } : editor;
          baseRef.current = renderBaseModel(workTexture, shown, dimensions);
          baseSigRef.current = signature;
        }
        const shown = compareMode ? { ...DEFAULT_EDITOR, accent: editor.accent } : editor;
        composeFrame(baseRef.current, shown, previewRef.current, dimensions, {
          frame: compareMode ? undefined : frame,
          showModelFx: !compareMode,
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [workTexture, editor, dimensions, compareMode, animation, playing]);

  useEffect(() => {
    if (playing) clockRef.current = performance.now() - frameRef.current.time;
  }, [playing, animation]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const notify = useCallback((message: string) => setToast(message), []);

  const commit = (next: EditorState) => {
    const trail = historyRef.current.slice(0, historyIndexRef.current + 1);
    trail.push(next);
    if (trail.length > 90) trail.shift();
    historyRef.current = trail;
    historyIndexRef.current = trail.length - 1;
    setEditor(next);
    bump((v) => v + 1);
  };

  const reset = () => {
    historyRef.current = [DEFAULT_EDITOR];
    historyIndexRef.current = 0;
    modeExpiryRef.current = 0;
    setModeRemaining(0);
    setEditor(DEFAULT_EDITOR);
    setCompareMode(false);
    setSizeMode("source");
    setAnimation("idle");
    setPlaying(true);
    clockRef.current = performance.now();
    bump((v) => v + 1);
  };

  const undo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    setEditor(historyRef.current[historyIndexRef.current]);
    bump((v) => v + 1);
  };

  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    setEditor(historyRef.current[historyIndexRef.current]);
    bump((v) => v + 1);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      }
      if (event.key === " " && tag !== "INPUT") {
        event.preventDefault();
        setPlaying((p) => !p);
      }
      if (event.key.toLowerCase() === "c" && !event.metaKey && !event.ctrlKey && tag !== "INPUT") {
        setCompareMode((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openFile = (file?: File) => {
    if (!file) return;
    if (!isSupportedImageFile(file)) {
      notify("PNG / JPG / WebP 画像を選んでください");
      return;
    }
    loadImageFile(file).then((img) => {
      setTexture(img);
      setSizeMode("source");
      setFileName(file.name);
      setCompareMode(false);
      reset();
      notify(`${file.name} を読み込みました`);
    }).catch(() => {
      notify("画像を開けませんでした");
    });
  };

  const tune = (patch: Partial<EditorState>) => {
    commit({ ...editor, ...patch, preset: "custom" });
    setCompareMode(false);
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    commit({ ...editor, ...preset.settings, preset: preset.id });
    setCompareMode(false);
  };

  const toggleDecoration = (decoration: DecorationId) => {
    const current = editor.decorationStack.length > 0
      ? editor.decorationStack
      : editor.decoration === "none"
        ? []
        : [editor.decoration];
    const next = decoration === "none"
      ? []
      : current.includes(decoration as Exclude<DecorationId, "none">)
        ? current.filter((item) => item !== decoration)
        : [...current, decoration as Exclude<DecorationId, "none">];
    commit({
      ...editor,
      decoration: next[0] ?? "none",
      decorationStack: next,
      preset: "custom",
    });
    setCompareMode(false);
  };

  const setTier = (tier: TierId) => { commit({ ...editor, tier }); setCompareMode(false); notify(`${findTier(tier).name} へ強化`); };
  const setForm = (form: FormId) => { commit({ ...editor, form }); setCompareMode(false); notify(`形態: ${findForm(form).name}`); };
  const setTheme = (theme: ThemeId) => { commit({ ...editor, theme }); setCompareMode(false); notify(`テーマ: ${findTheme(theme).name}`); };

  const activateMode = (mode: ModeId) => {
    commit({ ...editor, mode });
    setCompareMode(false);
    const def = findMode(mode);
    if (mode !== "none" && def.duration > 0) {
      modeExpiryRef.current = Date.now() + def.duration;
      setModeRemaining(def.duration);
      notify(`${def.name} 発動！ ${Math.round(def.duration / 1000)}秒間`);
    } else {
      modeExpiryRef.current = 0;
      setModeRemaining(0);
    }
  };

  const playAnim = (id: AnimationId) => {
    setAnimation(id);
    setPlaying(true);
    setCompareMode(false);
    clockRef.current = performance.now();
  };

  const buildCanvas = (frame?: AnimationFrame) => {
    if (!workTexture) return null;
    const out = document.createElement("canvas");
    renderTexture(workTexture, editor, out, dimensions, { frame, showModelFx: true });
    return out;
  };

  const download = (canvas: HTMLCanvasElement, name: string) => {
    downloadCanvas(canvas, name, () => notify("書き出しに失敗しました"));
  };

  const nameBase = fileName.replace(/\.[^/.]+$/, "") || "texture";
  const nameSuffix = [
    editor.tier !== "base" ? findTier(editor.tier).short : "",
    editor.form !== "standard" ? findForm(editor.form).id : "",
    editor.theme !== "signature" ? findTheme(editor.theme).id : "",
    editor.overclock >= 25 ? `oc${editor.overclock}` : "",
  ].filter(Boolean).join("_");

  const exportPng = () => {
    const out = buildCanvas();
    if (!out) return;
    download(out, `${nameBase}${nameSuffix ? `_${nameSuffix}` : ""}.png`);
    notify("PNGを書き出しました");
  };

  const exportSheet = () => {
    if (!workTexture) return;
    const frames = 8;
    const def = findAnimation(animation);
    const sheet = document.createElement("canvas");
    sheet.width = dimensions.width * frames;
    sheet.height = dimensions.height;
    const ctx = sheet.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const cell = document.createElement("canvas");
    for (let i = 0; i < frames; i += 1) {
      const p = i / frames;
      renderTexture(workTexture, editor, cell, dimensions, {
        frame: { animation, time: p * def.duration, progress: p, playing: true },
        showModelFx: true,
      });
      ctx.drawImage(cell, i * dimensions.width, 0);
    }
    download(sheet, `${nameBase}_${animation}_8f.png`);
    notify(`${def.name} の8コマシートを書き出しました`);
  };

  const tier = findTier(editor.tier);
  const form = findForm(editor.form);
  const theme = findTheme(editor.theme);
  const mode = findMode(editor.mode);
  const anim = findAnimation(animation);

  // derived stat readout for the inspector card
  const stats = useMemo(() => {
    const oc = editor.overclock / 100;
    const attack = Math.min(100, 12 + tier.rank * 14 + editor.highlight * 0.45 + oc * 22 + (mode.id === "berserk" ? 14 : 0));
    const magic = Math.min(100, 10 + tier.rank * 12 + editor.glow * 0.6 + oc * 20 + (mode.id === "overdrive" ? 18 : 0) + (theme.id !== "signature" ? 8 : 0));
    const guard = Math.min(100, 14 + tier.rank * 10 + editor.edge * 0.4 + (mode.id === "guard" ? 22 : 0));
    const radiant = Math.min(100, 6 + editor.glow * 0.9 + tier.glowAdd * 0.8 + oc * 26 + editor.highlight * 0.3);
    return [
      { label: "攻撃", value: Math.round(attack) },
      { label: "魔力", value: Math.round(magic) },
      { label: "耐久", value: Math.round(guard) },
      { label: "光輝", value: Math.round(radiant), hot: true },
    ];
  }, [tier, editor.highlight, editor.glow, editor.edge, editor.overclock, mode.id, theme.id]);

  const statusParts = compareMode
    ? ["元テクスチャ比較中"]
    : [
        `${tier.name} ${tier.short}`,
        form.id !== "standard" && form.name,
        theme.id !== "signature" && theme.name,
        editor.decorationStack.length > 0 && `${editor.decorationStack.length}装飾`,
        editor.overclock >= 25 && `OC ${editor.overclock}%`,
        mode.id !== "none" && `${mode.name}`,
      ].filter(Boolean) as string[];

  const canvasStatus = compareMode ? "元テクスチャ比較中" : statusParts.join(" · ") || "標準状態";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Icon name="pixel" size={20} /></div>
          <div className="brand-copy">
            <strong>PIXELBLOOM</strong>
            <span>FORGE STUDIO</span>
          </div>
        </div>

        <div className="topbar-project">
          <span className="dot" />
          <div className="project-copy">
            <span>ACTIVE MODEL</span>
            <strong title={fileName}>{fileName}</strong>
          </div>
          <span className="sep" />
          <span className="local-status">{canvasStatus}</span>
        </div>

        <div className="topbar-actions">
          <button className="icon-btn" onClick={undo} disabled={historyIndexRef.current <= 0} title="元に戻す (Ctrl+Z)" aria-label="元に戻す"><Icon name="undo" /></button>
          <button className="icon-btn" onClick={redo} disabled={historyIndexRef.current >= historyRef.current.length - 1} title="やり直す (Ctrl+Shift+Z)" aria-label="やり直す"><Icon name="redo" /></button>
          <span className="sep action-sep" />
          <button className="ghost-btn hide-sm" onClick={reset}><Icon name="reset" size={14} /><span>リセット</span></button>
          <button className="cta" onClick={exportPng} disabled={!workTexture}><Icon name="download" size={15} /><span>PNG書き出し</span></button>
        </div>
      </header>

      <div className="workspace-grid">
        {/* ================= LEFT RAIL ================= */}
        <aside className="left-rail">
          <section className="source-card">
            <div className="card-label"><span>Source</span><span>01</span></div>
            <h1 className="card-title">テクスチャ</h1>
            <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
              <Icon name="upload" size={16} />
              <span>画像を読み込む</span>
              <span className="upload-tag">16–128</span>
            </button>

            <div className="source-info">
              <div className="source-thumb"><Icon name="image" size={17} /></div>
              <div className="source-meta">
                <strong title={fileName}>{fileName}</strong>
                <span>{dimensions.width}×{dimensions.height}px</span>
              </div>
            </div>

            <div className="size-row" role="group" aria-label="出力サイズ">
              {SIZES.map((s) => (
                <button
                  key={String(s.value)}
                  className={`size-btn ${sizeMode === s.value ? "is-active" : ""}`}
                  onClick={() => setSizeMode(s.value)}
                  title={s.value === "source" ? "元画像のサイズを維持" : `${s.value}×${s.value} にリサイズ`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          <div className="tabs">
            <button className={`tab ${panel === "look" ? "is-active" : ""}`} onClick={() => setPanel("look")}><Icon name="palette" size={15} /><span>ルック</span></button>
            <button className={`tab ${panel === "model" ? "is-active" : ""}`} onClick={() => setPanel("model")}><Icon name="layers" size={15} /><span>モデル</span></button>
            <button className={`tab ${panel === "combat" ? "is-active" : ""}`} onClick={() => setPanel("combat")}><Icon name="bolt" size={15} /><span>戦闘</span></button>
          </div>

          {panel === "look" && (
            <>
              <section className="block">
                <div className="block-head">
                  <div><div className="card-label"><span>Looks</span></div><h2>エフェクト</h2></div>
                  <Icon name="sparkle" size={15} />
                </div>
                <div className="preset-grid">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className={`preset ${editor.preset === preset.id ? "is-active" : ""}`}
                      onClick={() => applyPreset(preset)}
                      aria-pressed={editor.preset === preset.id}
                    >
                      <span className={`swatch sw-${preset.id}`}><span /><span /><span /></span>
                      <span className="preset-copy"><strong>{preset.name}</strong><small>{preset.description}</small></span>
                      {editor.preset === preset.id && <Icon name="check" size={14} />}
                    </button>
                  ))}
                </div>
              </section>

              <section className="block">
                <div className="block-head">
                  <div><div className="card-label"><span>Details</span></div><h2>特殊装飾</h2></div>
                  <Icon name="rune" size={15} />
                </div>
                <div className="tiles four">
                  {DECORATIONS.map((d) => (
                    <button
                      key={d.id}
                      className={`tile ${d.id === "none" ? editor.decorationStack.length === 0 : editor.decorationStack.includes(d.id as Exclude<DecorationId, "none">) ? "is-active" : ""}`}
                      onClick={() => toggleDecoration(d.id)}
                      aria-pressed={d.id === "none" ? editor.decorationStack.length === 0 : editor.decorationStack.includes(d.id as Exclude<DecorationId, "none">)}
                    >
                      <Icon name={d.icon} size={16} /><span>{d.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {panel === "model" && (
            <>
              <section className="block">
                <div className="block-head">
                  <div><div className="card-label"><span>Progression</span></div><h2>段階強化</h2></div>
                  <Icon name="tier" size={15} />
                </div>
                <div className="tiers">
                  {TIERS.map((t, i) => (
                    <button
                      key={t.id}
                      className={`tier ${editor.tier === t.id ? "is-now" : tier.rank >= t.rank ? "is-on" : ""}`}
                      onClick={() => setTier(t.id)}
                      title={`${t.name} — ${t.description}`}
                    >
                      <span className="tier-bar" style={i === TIERS.length - 1 ? { display: "none" } : undefined} />
                      <span className="tier-node">{t.short}</span>
                      <span className="tier-name">{t.name}</span>
                    </button>
                  ))}
                </div>
                <p className="hint">{tier.description}</p>
              </section>

              <section className="block">
                <div className="block-head">
                  <div><div className="card-label"><span>Limit Break</span></div><h2>限界突破</h2></div>
                  <Icon name="burst" size={15} />
                </div>
                <div className="lb-readout">
                  <span className="lb-value">{editor.overclock}</span>
                  <span className="lb-unit">% OC</span>
                </div>
                <div className="lb-track"><span className="lb-fill" style={{ width: `${editor.overclock}%` }} /></div>
                <div className={`lb-state ${editor.overclock >= 25 ? "is-live" : ""}`}>
                  <Icon name={editor.overclock >= 25 ? "burst" : "circle"} size={12} />
                  <span>{editor.overclock >= 25 ? "限界突破 発動中" : "25%で限界突破"}</span>
                </div>
                <div className="sliders" style={{ marginTop: 13 }}>
                  <Slider label="オーバークロック" value={editor.overclock} min={0} max={100} onChange={(v) => tune({ overclock: v })} />
                </div>
              </section>

              <section className="block">
                <div className="block-head">
                  <div><div className="card-label"><span>Form</span></div><h2>形態変化</h2></div>
                  <Icon name="layers" size={15} />
                </div>
                <div className="tiles">
                  {FORMS.map((f) => (
                    <button
                      key={f.id}
                      className={`tile ${editor.form === f.id ? "is-active" : ""}`}
                      onClick={() => setForm(f.id)}
                      title={f.description}
                    >
                      <Icon name={f.icon} size={16} /><span>{f.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="block">
                <div className="block-head">
                  <div><div className="card-label"><span>Theme</span></div><h2>テーマ別</h2></div>
                  <Icon name="palette" size={15} />
                </div>
                <div className="themes">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      className={`theme ${editor.theme === t.id ? "is-active" : ""}`}
                      onClick={() => setTheme(t.id)}
                      style={{ ["--tc" as string]: t.accent }}
                    >
                      <span className="theme-dot" />
                      <Icon name={t.icon} size={15} />
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {panel === "combat" && (
            <>
              <section className="block">
                <div className="block-head">
                  <div><div className="card-label"><span>Battle Mode</span></div><h2>一時モード</h2></div>
                  <Icon name="shield" size={15} />
                </div>
                <div className="tiles">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      className={`tile hot ${editor.mode === m.id ? "is-active" : ""}`}
                      onClick={() => activateMode(m.id)}
                      title={m.description}
                    >
                      <Icon name={m.icon} size={16} /><span>{m.name}</span>
                    </button>
                  ))}
                </div>

                {mode.id !== "none" && mode.duration > 0 && (
                  <div className="timer" style={{ ["--tc" as string]: mode.aura }}>
                    <span className="timer-chip"><Icon name={mode.icon} size={11} />{mode.name}</span>
                    <span className="timer-track"><span style={{ width: `${(modeRemaining / mode.duration) * 100}%`, background: mode.aura }} /></span>
                    <span className="timer-num">{(modeRemaining / 1000).toFixed(1)}s</span>
                  </div>
                )}
                <p className="hint">{mode.description}</p>
              </section>

              <section className="block">
                <div className="block-head">
                  <div><div className="card-label"><span>Animation</span></div><h2>攻撃・魔法</h2></div>
                  <Icon name="bolt" size={15} />
                </div>
                <div className="tiles">
                  {ANIMATIONS.map((a) => (
                    <button
                      key={a.id}
                      className={`tile cool ${animation === a.id ? "is-active" : ""}`}
                      onClick={() => playAnim(a.id)}
                      title={a.description}
                    >
                      <Icon name={a.icon} size={16} /><span>{a.name}</span>
                    </button>
                  ))}
                </div>

                <div className="playback">
                  <button className="playback-btn" onClick={() => setPlaying((p) => !p)}>
                    <Icon name={playing ? "pause" : "play"} size={14} /><span>{playing ? "一時停止" : "再生"}</span>
                  </button>
                  <button className="playback-btn alt" onClick={exportSheet} disabled={!workTexture}>
                    <Icon name="download" size={13} /><span>8コマ</span>
                  </button>
                </div>

                <div className="kbd-row">
                  <span className="kbd"><b>Space</b> 再生</span>
                  <span className="kbd"><b>C</b> 比較</span>
                  <span className="kbd"><b>Ctrl Z</b> 戻す</span>
                </div>
              </section>
            </>
          )}

          <div className="rail-foot">
            <span className="mini-mark"><i /><i /><i /><i /></span>
            <span>FORGE · <em>EVOLVE</em> · DEPLOY</span>
          </div>
        </aside>

        {/* ================= STAGE ================= */}
        <main className="stage-wrap">
          <div className="stage-bar">
            <div className="stage-bar-head">
              <div className="stage-bar-mark"><Icon name="image" size={15} /></div>
              <div className="stage-bar-copy">
                <strong>キャンバス</strong>
                <span>{canvasStatus}</span>
              </div>
            </div>
            <div className="stage-bar-tools">
              <button className={`tool ${playing ? "is-active" : ""}`} onClick={() => setPlaying((p) => !p)} title="再生 / 一時停止 (Space)">
                <Icon name={playing ? "pause" : "play"} size={14} /><span>{playing ? "動作中" : "停止"}</span>
              </button>
              <button className={`tool ${compareMode ? "is-active" : ""}`} onClick={() => setCompareMode((v) => !v)} title="加工前と比較 (C)">
                <Icon name="eye" size={14} /><span>{compareMode ? "編集結果" : "比較"}</span>
              </button>
              <span className="toolbar-divider" />
              <div className="zoom" aria-label="プレビュー倍率">
                <button onClick={() => setZoom((v) => Math.max(60, v - 10))} disabled={zoom <= 60} aria-label="縮小"><Icon name="minus" size={13} /></button>
                <button className="zoom-val" onClick={() => setZoom(100)} title="100%に戻す">{zoom}%</button>
                <button onClick={() => setZoom((v) => Math.min(170, v + 10))} disabled={zoom >= 170} aria-label="拡大"><Icon name="plus" size={13} /></button>
              </div>
            </div>
          </div>

          <section
            className={`stage ${isDragging ? "is-drag" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); openFile(e.dataTransfer.files[0]); }}
          >
            <div className="rings" />
            <div className="pedestal" />

            {workTexture ? (
              <div className="frame" style={{ transform: `scale(${zoom / 100})` }}>
                <canvas ref={previewRef} className="tex-canvas" aria-label="編集プレビュー" />
              </div>
            ) : (
              <button className="drop-empty" onClick={() => fileInputRef.current?.click()}>
                <span className="drop-empty-icon"><Icon name="upload" size={22} /></span>
                <strong>テクスチャをドロップ</strong>
                <span>PNG · JPG · WEBP</span>
              </button>
            )}

            {workTexture && (
              <div className="pills">
                <span className="pill lime"><Icon name="tier" size={11} />{tier.short}</span>
                {editor.overclock >= 25 && <span className="pill ember"><Icon name="burst" size={11} />OC {editor.overclock}%</span>}
                {form.id !== "standard" && <span className="pill">{form.name}</span>}
                {theme.id !== "signature" && (
                  <span className="pill violet" style={{ borderColor: theme.accent, color: theme.accent }}>
                    <Icon name={theme.icon} size={11} />{theme.name}
                  </span>
                )}
                {mode.id !== "none" && <span className="pill ember"><Icon name={mode.icon} size={11} />{mode.name}</span>}
                {animation !== "idle" && <span className="pill sky"><Icon name={anim.icon} size={11} />{anim.name}</span>}
              </div>
            )}

            {isDragging && (
              <div className="drop-veil">
                <Icon name="upload" size={26} />
                <strong>ここにドロップ</strong>
                <span>PNG · JPG · WEBP · 16–128px</span>
              </div>
            )}

            <div className="stage-caption">
              <span className="dot" />
              <span>{dimensions.width}×{dimensions.height}</span>
              <em>·</em>
              <span>alpha</span>
            </div>
            <span className="bracket tl" />
            <span className="bracket br" />
          </section>

          <div className="stage-foot">
            <span><span className="dot" />すべての処理は端末内で完結</span>
            <span>出力 <strong>{dimensions.width} × {dimensions.height}</strong></span>
          </div>
        </main>

        {/* ================= INSPECTOR ================= */}
        <aside className="inspector">
          <div className="inspector-head">
            <div>
              <div className="card-label"><span>Tuning</span></div>
              <h2>微調整</h2>
            </div>
            <button className="icon-btn" onClick={reset} title="すべてリセット" aria-label="リセット"><Icon name="reset" size={16} /></button>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-name">{tier.name}</span>
              <span className="stat-rank">RANK {tier.short}</span>
            </div>
            <div className="stat-bars">
              {stats.map((s) => (
                <div className="stat-bar" key={s.label}>
                  <span>{s.label}</span>
                  <span className="stat-track"><span className={`stat-fill ${s.hot ? "hot" : ""}`} style={{ width: `${s.value}%` }} /></span>
                  <span>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <section className="sec">
            <div className="sec-head"><span><Icon name="sliders" size={14} />色と光</span></div>
            <div className="sliders">
              <Slider label="明るさ" value={editor.brightness} min={60} max={145} onChange={(v) => tune({ brightness: v })} />
              <Slider label="コントラスト" value={editor.contrast} min={60} max={160} onChange={(v) => tune({ contrast: v })} />
              <Slider label="彩度" value={editor.saturation} min={0} max={200} onChange={(v) => tune({ saturation: v })} />
              <Slider label="グロー" value={editor.glow} min={0} max={40} onChange={(v) => tune({ glow: v })} />
              <Slider label="ビネット" value={editor.vignette} min={0} max={100} onChange={(v) => tune({ vignette: v })} />
            </div>
          </section>

          <section className="sec">
            <div className="sec-head"><span><Icon name="pixel" size={14} />ピクセル質感</span></div>
            <div className="sliders">
              <Slider label="色相" value={editor.hue} min={-180} max={180} suffix="°" onChange={(v) => tune({ hue: v })} />
              <Slider label="ドット粗さ" value={editor.pixelSize} min={1} max={8} suffix="px" onChange={(v) => tune({ pixelSize: v })} />
              <Slider label="ノイズ" value={editor.noise} min={0} max={40} onChange={(v) => tune({ noise: v })} />
              <Slider label="ハイライト" value={editor.highlight} min={0} max={40} onChange={(v) => tune({ highlight: v })} />
              <Slider label="縁光" value={editor.edge} min={0} max={40} onChange={(v) => tune({ edge: v })} />
              <Slider label="走査線" value={editor.scanline} min={0} max={40} onChange={(v) => tune({ scanline: v })} />
            </div>
          </section>

          <section className="sec">
            <div className="sec-head"><span><Icon name="sparkle" size={14} />装飾カラー</span></div>
            <div className="accent-row">
              <label className="picker" title="カラーを選択">
                <input type="color" value={editor.accent} onChange={(e) => tune({ accent: e.currentTarget.value })} aria-label="装飾カラー" />
                <span className="picker-view" style={{ backgroundColor: editor.accent, color: editor.accent }} />
              </label>
              <div className="accent-copy">
                <strong>アクセント</strong>
                <span>{theme.id === "signature" ? "縁取り・発光・技" : `テーマ優先: ${theme.name}`}</span>
              </div>
              <span className="accent-hex">{editor.accent.toUpperCase()}</span>
            </div>
            <div className="swatches">
              {["#c8f077", "#79e8d0", "#b98cff", "#ff7a3c", "#ffbe4f", "#ff5a5a", "#6fc0ff", "#ff8ad0"].map((c) => (
                <button
                  key={c}
                  className={`chip-color ${editor.accent.toLowerCase() === c ? "is-on" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => tune({ accent: c })}
                  aria-label={c}
                  aria-pressed={editor.accent.toLowerCase() === c}
                />
              ))}
            </div>
          </section>

          <div className="inspector-foot">
            <div className="foot-mark"><Icon name="check" size={13} /></div>
            <div>
              <strong>元サイズを維持して保存</strong>
              <span>透過PNG · {dimensions.width}×{dimensions.height}</span>
            </div>
          </div>
        </aside>
      </div>

      <input
        ref={fileInputRef}
        className="file-input"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => { openFile(e.currentTarget.files?.[0]); e.currentTarget.value = ""; }}
      />

      {toast && <div className="toast" role="status"><Icon name="check" size={16} />{toast}</div>}
    </div>
  );
}
