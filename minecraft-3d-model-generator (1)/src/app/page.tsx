"use client";

import ExportBar from "@/components/ExportBar";
import Gallery from "@/components/Gallery";
import SetGenerator from "@/components/SetGenerator";
import SpecPanel from "@/components/SpecPanel";
import Viewer from "@/components/Viewer";
import {
  ACTION_LABELS,
  ANIMATION_LABELS,
  MAGIC_AURAS,
  MAGIC_PARTICLES,
  MODE_LABELS,
  MODEL_TYPE_LABELS,
  defaultSpec,
  DECORATION_LABELS,
  FLOATING_LABELS,
  MAGIC_THEMES,
  PARTICLE_LABELS,
  STYLE_PRESETS,
  AURA_LABELS,
  TRAIL_LABELS,
} from "@/lib/spec";
import type {
  ActionKind,
  AuraKind,
  Decoration,
  FloatingMode,
  MagicSystem,
  ModeKind,
  ModelSpec,
  ModelType,
  ParticleKind,
  PhantomKind,
  Tier,
  TrailKind,
} from "@/lib/spec";
import { generateModelWithPhantom } from "@/lib/generator";
import { Rng } from "@/lib/rng";
import { useDeferredValue, useMemo, useRef, useState } from "react";

const DECORATION_KEYS = Object.keys(DECORATION_LABELS) as Decoration[];
const FLOATING_KEYS = Object.keys(FLOATING_LABELS) as FloatingMode[];
const PARTICLE_KEYS = Object.keys(PARTICLE_LABELS) as ParticleKind[];
const ANIMATION_KEYS = Object.keys(ANIMATION_LABELS) as ModelSpec["animation"][];
const AURA_KEYS = Object.keys(AURA_LABELS) as AuraKind[];
const TRAIL_KEYS = Object.keys(TRAIL_LABELS) as TrailKind[];
const MODEL_TYPES = Object.keys(MODEL_TYPE_LABELS) as ModelType[];
const MAGIC_KEYS = Object.keys(MAGIC_THEMES) as MagicSystem[];
const PRESET_KEYS = Object.keys(STYLE_PRESETS) as (keyof typeof STYLE_PRESETS)[];
const TIER_KEYS = [1, 2, 3, 4] as Tier[];
const MODE_KEYS = Object.keys(MODE_LABELS) as ModeKind[];
const ACTION_KEYS = Object.keys(ACTION_LABELS) as ActionKind[];

function randomSpec(): ModelSpec {
  const seed = Math.floor(Math.random() * 1e9);
  const rng = new Rng(seed);
  const spec = defaultSpec();
  spec.seed = seed;
  spec.type = rng.pick(MODEL_TYPES);
  spec.magic = rng.pick(MAGIC_KEYS);
  spec.stylePreset = rng.pick(PRESET_KEYS);
  spec.scale = rng.range(0.3, 0.8);
  spec.length = rng.range(0.3, 0.8);
  spec.width = rng.range(0.25, 0.75);
  spec.detail = rng.range(0.2, 0.9);
  spec.blockiness = rng.range(0, 1);
  spec.glowIntensity = rng.range(0.3, 0.9);
  spec.textureNoise = rng.range(0.2, 0.9);
  spec.floating = rng.pick(FLOATING_KEYS);
  spec.animation = rng.pick(ANIMATION_KEYS);
  spec.particles = MAGIC_PARTICLES[spec.magic];
  spec.aura = rng.pick(AURA_KEYS);
  spec.trail = rng.pick(TRAIL_KEYS);
  spec.tier = rng.pick(TIER_KEYS);
  spec.limitBreak = rng.pick([0, 0, 0, 1, 2, 3] as ModelSpec["limitBreak"][]);
  spec.morph = rng.pick(["standard", "standard", "great", "fragment", "twin"] as ModelSpec["morph"][]);
  spec.phantom = rng.pick(["none", "mirror", "spiral", "orbit"] as PhantomKind[]);
  spec.decorations = DECORATION_KEYS.filter(() => rng.chance(0.4));
  if (spec.decorations.length === 0) spec.decorations = ["gem"];
  STYLE_PRESETS[spec.stylePreset].apply(spec);
  return spec;
}

function decodeSpecFromUrl(): ModelSpec | null {
  if (typeof window === "undefined") return null;
  const param = new URLSearchParams(window.location.search).get("m");
  if (!param) return null;
  try {
    const json = decodeURIComponent(escape(atob(param)));
    const parsed = JSON.parse(json) as ModelSpec;
    if (parsed && parsed.version === 1 && typeof parsed.type === "string") {
      return { ...defaultSpec(), ...parsed };
    }
  } catch { /* ignore */ }
  return null;
}

export default function HomePage() {
  const [spec, setSpec] = useState<ModelSpec>(() => decodeSpecFromUrl() ?? defaultSpec());
  const [refreshKey, setRefreshKey] = useState(0);
  const [savedId, setSavedId] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<ModeKind>("idle");
  const [action, setAction] = useState<{ type: ActionKind; nonce: number } | null>(null);
  const [history, setHistory] = useState<ModelSpec[]>([]);
  const nonceRef = useRef(0);
  const deferredSpec = useDeferredValue(spec);

  const model = useMemo(() => generateModelWithPhantom(deferredSpec), [deferredSpec]);

  const patchSpec = (patch: Partial<ModelSpec>) => {
    setHistory((h) => [...h.slice(-24), spec]);
    setSpec((s) => ({ ...s, ...patch }));
  };
  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setSpec(prev);
  };

  const playAction = (type: ActionKind) => {
    nonceRef.current += 1;
    setAction({ type, nonce: nonceRef.current });
  };

  const loadSpec = (s: ModelSpec) => {
    setSpec({ ...defaultSpec(), ...s });
    setMode("idle");
  };

  const handleSave = async () => {
    const res = await fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: spec.name, modelType: spec.type, seed: spec.seed, spec }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error("save failed");
    setSavedId(data.id);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* header */}
      <header className="flex shrink-0 items-center justify-between border-b-2 border-[var(--color-line)] bg-[var(--color-panel)] px-5 py-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-pixel text-xl tracking-wider text-[var(--color-xp)] drop-shadow-[2px_2px_0_#000]">
            VOXELFORGE
          </h1>
          <span className="text-xs text-[var(--color-fog)]">ボクセルモデル工房 — 強化・限界突破・形態変化対応</span>
        </div>
        <div className="hidden items-center gap-2 text-[10px] text-[var(--color-fog)] sm:flex">
          <span className="chip px-2 py-1" data-on={false}>{spec.tier === 1 ? "T1" : `T${spec.tier}`}</span>
          {spec.limitBreak > 0 ? <span className="chip px-2 py-1" data-on={false}>LB{spec.limitBreak}</span> : null}
          <span className="chip px-2 py-1" data-on={false}>parts {model.parts.length}</span>
          <span className="chip px-2 py-1" data-on={false}>seed {spec.seed}</span>
        </div>
      </header>

      {/* main grid */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_1fr_300px]">
        {/* left: spec editor */}
        <aside className="panel m-3 hidden min-h-0 flex-col overflow-hidden lg:flex">
          <SpecPanel spec={spec} onChange={patchSpec} onRandomize={() => { setHistory((h) => [...h.slice(-24), spec]); setSpec(randomSpec()); }} onUndo={undo} canUndo={history.length > 0} />
        </aside>

        {/* center: 3D viewer */}
        <main className="relative m-3 min-h-[420px] overflow-hidden border-2 border-[var(--color-line)] bg-[var(--color-panel2)] shadow-[6px_6px_0_rgba(0,0,0,0.35)] lg:min-h-0">
          <Viewer model={model} spec={deferredSpec} mode={mode} action={action} />

          {/* top-left: identity */}
          <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
            <div className="pointer-events-auto inline-block border-2 border-[var(--color-line)] bg-[rgba(12,16,22,0.85)] px-2 py-1 font-pixel text-xs text-[var(--color-xp)]">
              {spec.name} {spec.tier > 1 ? `・T${spec.tier}` : ""}{spec.limitBreak > 0 ? `・LB${spec.limitBreak}` : ""}
            </div>
            <div className="inline-block border-2 border-[var(--color-line)] bg-[rgba(12,16,22,0.85)] px-2 py-1 text-[10px] text-[var(--color-fog)]">
              {MODEL_TYPE_LABELS[spec.type]} / {spec.magic} / {spec.floating} / {spec.animation} / {spec.aura}
            </div>
          </div>

          {/* top-right: mode + action controls */}
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            <div className="flex overflow-hidden border-2 border-[var(--color-line)] bg-[rgba(12,16,22,0.85)]">
              {MODE_KEYS.map((m) => (
                <button
                  key={m}
                  className={`px-2 py-1 font-pixel text-[10px] transition-colors ${
                    mode === m ? "bg-[rgba(255,180,71,0.25)] text-[var(--color-gold)]" : "text-[var(--color-fog)] hover:text-white"
                  }`}
                  onClick={() => setMode(m)}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {ACTION_KEYS.map((a) => (
                <button
                  key={a}
                  className="pixel-btn bg-[rgba(12,16,22,0.9)] px-3 py-1.5 text-xs text-[var(--color-xp)] outline outline-1 outline-[var(--color-line)]"
                  onClick={() => playAction(a)}
                >
                  {a === "attack" ? "⚔ " : "✦ "}{ACTION_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-3 right-3 border-2 border-[var(--color-line)] bg-[rgba(12,16,22,0.85)] px-2 py-1 text-[10px] text-[var(--color-fog)]">
            ドラッグで回転 ・ スクロールでズーム
          </div>

          {/* mobile toggle */}
          <details className="absolute bottom-3 left-3 lg:hidden">
            <summary className="pixel-btn cursor-pointer bg-[var(--color-panel)] px-3 py-2 text-xs text-[var(--color-xp)]">⚙ 仕様を編集</summary>
            <div className="panel mt-2 max-h-[60vh] w-[86vw] overflow-y-auto">
              <SpecPanel spec={spec} onChange={patchSpec} onRandomize={() => { setHistory((h) => [...h.slice(-24), spec]); setSpec(randomSpec()); }} onUndo={undo} canUndo={history.length > 0} />
            </div>
          </details>
        </main>

        {/* right: set gen + export + gallery */}
        <aside className="panel m-3 hidden min-h-0 flex-col overflow-hidden lg:flex">
          <SetGenerator currentPreset={spec.stylePreset} onSaved={() => setRefreshKey((k) => k + 1)} />
          <ExportBar spec={spec} model={model} onSave={handleSave} saved={savedId !== undefined} />
          <div className="min-h-0 flex-1">
            <Gallery refreshKey={refreshKey} onLoad={loadSpec} currentId={savedId} />
          </div>
        </aside>
      </div>
    </div>
  );
}