"use client";
import { useEffect, useRef } from "react";
import { CLIPS, EFFECTS, KINDS, PRESETS, RANKS, themeById } from "@/lib/forge";
import { clamp } from "@/lib/forge/util";
import { playhead } from "@/lib/playhead";
import { useForge, type ViewKey } from "@/lib/store";
import { useDerived } from "../ForgeProvider";

/** タイムライン：ドラッグで任意のフレームに寄せられる（HUD は再レンダーせず DOM 直接更新） */
function Timeline() {
  const clip = useForge((s) => s.clip);
  const scrub = useForge((s) => s.scrub);
  const setScrub = useForge((s) => s.setScrub);
  const play = useForge((s) => s.play);
  const head = useRef<HTMLSpanElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t = clamp(playhead.t01, 0, 1);
      if (head.current) head.current.style.left = `${(t * 100).toFixed(2)}%`;
      if (readout.current) readout.current.textContent = `${(t * playhead.length).toFixed(2)}／${playhead.length.toFixed(2)}s`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const at = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1);
  };

  return (
    <div className="pointer-events-auto flex items-center gap-2 border border-white/15 bg-black/60 px-2 py-1 backdrop-blur-[2px]">
      <span className="font-mono text-[9px] tracking-[0.2em] text-brass">{CLIPS.find((c) => c.id === clip)?.glyph ?? "待"}</span>
      <div
        className="relative h-4 w-32 cursor-ew-resize touch-none sm:w-56"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          setScrub(at(e));
        }}
        onPointerMove={(e) => {
          if (dragging.current) setScrub(at(e));
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        aria-label="タイムラインスクラブ"
        role="slider"
        aria-valuenow={Math.round((scrub ?? 0) * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/25" />
        {[0.25, 0.5, 0.75].map((p) => (
          <span key={p} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-white/20" style={{ left: `${p * 100}%` }} />
        ))}
        <span ref={head} className="absolute top-1/2 h-3 w-[3px] -translate-x-1/2 -translate-y-1/2 bg-vermilion" style={{ left: "0%" }} />
      </div>
      <span ref={readout} className="w-[74px] font-mono text-[9px] tabular-nums text-white/55" />
      <button
        type="button"
        onClick={() => {
          setScrub(null);
          if (clip !== "idle") play(clip);
        }}
        className={`font-mono text-[9px] tracking-[0.14em] transition-colors ${scrub !== null ? "text-white hover:text-brass" : "text-white/30"}`}
        title="スクラブを解いて自動再生に戻す"
      >
        ▶自動
      </button>
    </div>
  );
}

function PhantomControl() {
  const phantom = useForge((s) => s.params.view.phantom);
  const setDeep = useForge((s) => s.setDeep);
  const say = useForge((s) => s.say);
  return (
    <div className="flex items-center border border-white/15 bg-black/55 backdrop-blur-[2px]">
      <span className="px-2 py-1.5 font-mono text-[9px] tracking-[0.2em] text-white/45">幻影</span>
      {[0, 2, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => {
            setDeep("view", { phantom: v });
            if (v === 0) say("幻影を解きました");
          }}
          aria-pressed={phantom === v}
          title={v === 0 ? "残像なし" : `残像を ${v} 本`}
          className={`border-l border-white/10 px-2 py-1.5 font-mono text-[11px] tabular-nums transition-colors duration-100 ${
            phantom === v ? "bg-white/85 text-black" : "text-white/70 hover:bg-white/10"
          }`}
        >
          {v === 0 ? "−" : v}
        </button>
      ))}
    </div>
  );
}

function ClipPlayer() {
  const clip = useForge((s) => s.clip);
  const play = useForge((s) => s.play);
  const anim = useForge((s) => s.params.anim);
  const setDeep = useForge((s) => s.setDeep);
  return (
    <div className="pointer-events-auto flex items-stretch border border-white/15 bg-black/60 backdrop-blur-[2px]">
      <span className="hidden items-center px-2 font-mono text-[9px] tracking-[0.24em] text-white/45 sm:flex">CLIP</span>
      {CLIPS.map((c) => {
        const on = clip === c.id;
        const isIdle = c.id === "idle";
        return (
          <button
            key={c.id}
            type="button"
            title={`${c.name} — ${c.note}`}
            onClick={() => {
              if (isIdle) setDeep("anim", { on: !anim.on });
              else play(c.id);
            }}
            aria-pressed={on}
            className={`group relative flex min-w-[46px] flex-col items-center border-l border-white/10 px-2 py-1 transition-colors duration-100 ${
              on ? (isIdle ? "bg-white/15 text-white" : "bg-vermilion text-white") : "text-white/70 hover:bg-white/10"
            }`}
          >
            <span className="font-display text-[15px] leading-none">{c.glyph}</span>
            <span className="mt-0.5 font-mono text-[7.5px] tracking-[0.1em] opacity-70">
              {isIdle ? (anim.on ? "▮▮" : "▶") : c.en.slice(0, 5)}
            </span>
            {on && !isIdle && <span className="absolute inset-x-0 bottom-0 h-[2px] animate-[clipbar_var(--clip-dur)_linear] bg-white" style={{ ["--clip-dur" as string]: `${c.length / Math.max(0.25, anim.speed)}s` }} />}
          </button>
        );
      })}
    </div>
  );
}

const VIEWS: { k: ViewKey; label: string; key: string }[] = [
  { k: "persp", label: "透視", key: "1" },
  { k: "front", label: "正面", key: "2" },
  { k: "side", label: "側面", key: "3" },
  { k: "top", label: "上面", key: "4" },
];

export default function StageHud() {
  const { gen } = useDerived();
  const view = useForge((s) => s.view);
  const setView = useForge((s) => s.setView);
  const params = useForge((s) => s.params);
  const setDeep = useForge((s) => s.setDeep);
  const setEffect = useForge((s) => s.setEffect);
  const preset = useForge((s) => s.preset);
  const active = EFFECTS.filter((e) => params.effects[e.id]?.on);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="pointer-events-auto flex items-center border border-white/15 bg-black/55 backdrop-blur-[2px]">
            <span className="hidden px-2 py-1.5 font-mono text-[9px] tracking-[0.24em] text-white/50 sm:block">VIEW</span>
            {VIEWS.map((v) => (
              <button
                key={v.k}
                type="button"
                onClick={() => setView(v.k)}
                title={`${v.label}（${v.key}）`}
                className={`px-2.5 py-1.5 text-[11px] transition-colors duration-100 ${
                  view === v.k ? "bg-vermilion text-white" : "text-white/75 hover:bg-white/10"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <ClipPlayer />
          {active.length > 0 && (
            <div className="pointer-events-auto flex max-w-[60vw] flex-wrap gap-1">
              {active.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEffect(e.id, { on: false })}
                  title={`${e.name} を外す`}
                  className="group flex items-center gap-1.5 border border-white/15 bg-black/55 py-0.5 pl-1 pr-1.5 text-[11px] text-white/85 backdrop-blur-[2px] hover:border-vermilion"
                >
                  <span
                    className="grid h-4 w-4 place-items-center font-display text-[10px] text-black"
                    style={{ background: params.effects[e.id].color }}
                  >
                    {e.glyph}
                  </span>
                  {e.name}
                  <span className="text-white/35 group-hover:text-vermilion">✕</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <PhantomControl />
          <div className="pointer-events-auto flex border border-white/15 bg-black/55 backdrop-blur-[2px]">
          <button
            type="button"
            onClick={() => setDeep("view", { wire: !params.view.wire })}
            aria-pressed={params.view.wire}
            className={`px-2.5 py-1.5 text-[11px] transition-colors duration-100 ${
              params.view.wire ? "bg-brass text-black" : "text-white/75 hover:bg-white/10"
            }`}
          >
            シーム
          </button>
          <button
            type="button"
            onClick={() => setDeep("view", { bloom: params.view.bloom > 0 ? 0 : 1 })}
            aria-pressed={params.view.bloom > 0}
            className={`border-l border-white/15 px-2.5 py-1.5 text-[11px] transition-colors duration-100 ${
              params.view.bloom > 0 ? "text-white" : "text-white/45 hover:bg-white/10"
            }`}
          >
            {params.view.bloom > 0 ? "✦ 発光" : "✧ 発光"}
          </button>
          <button
            type="button"
            onClick={() => setDeep("anim", { on: !params.anim.on })}
            aria-pressed={params.anim.on}
            title="アニメーション（Space）"
            className={`border-l border-white/15 px-2.5 py-1.5 text-[11px] transition-colors duration-100 ${
              params.anim.on ? "text-white" : "text-white/45 hover:bg-white/10"
            }`}
          >
            {params.anim.on ? "▮▮ 再生中" : "▶ 停止中"}
          </button>
        </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Timeline />
          <div className="font-mono text-[10px] leading-relaxed tracking-[0.1em] text-white/60">
            <div>
              <span className="text-white/40">BODY </span>
              <span className="tabular-nums text-white">{String(gen.bodyCount).padStart(3, "0")}</span>
              <span className="text-white/40"> ／ FX </span>
              <span className="tabular-nums text-vermilion">{String(gen.fxCount).padStart(3, "0")}</span>
              <span className="text-white/40"> ／ BONES </span>
              <span className="tabular-nums text-white">{gen.groups.length}</span>
              <span className="text-white/40"> ／ FACES </span>
              <span className="tabular-nums text-white">{gen.boxes.length * 6}</span>
            </div>
            <div className="hidden text-white/40 sm:block">A攻撃　F防御　S詠唱　D変身　P幻影　Space再生　⌘Z戻す</div>
          </div>
          <div className="text-right font-mono text-[10px] tracking-[0.2em] text-white/40">
            <span className={params.overdrive ? "text-vermilion" : "text-brass"}>
              段階{RANKS[params.tier].no}
              {params.overdrive ? "・極" : ""}
            </span>
            <span className="text-white/25"> ／ </span>LOOP {params.anim.loop}s ／ ×{params.anim.speed}
          </div>
        </div>

        {/* 型録ストリップ */}
        <div className="pointer-events-auto -mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 sm:-mx-4 sm:px-4 [scrollbar-width:none]">
          <span className="flex shrink-0 items-center border border-white/10 bg-black/60 px-2 font-mono text-[9px] tracking-[0.24em] text-brass">
            型録
          </span>
          {PRESETS.map((pr) => {
            const k = KINDS.find((x) => x.id === pr.kind);
            const t = themeById(pr.theme);
            const on = params.name === pr.name && params.kind === pr.kind;
            return (
              <button
                key={pr.id}
                type="button"
                onClick={() => preset(pr)}
                title={pr.caption}
                className={`flex shrink-0 items-center gap-2 border py-1 pl-1 pr-2.5 text-left backdrop-blur-[2px] transition-colors duration-100 ${
                  on ? "border-vermilion bg-vermilion/25" : "border-white/12 bg-black/55 hover:border-white/40"
                }`}
              >
                <span
                  className="grid h-7 w-7 place-items-center font-display text-[15px] leading-none"
                  style={{ background: `linear-gradient(135deg, ${t.palette.base} 0 50%, ${t.palette.shade} 50% 100%)`, color: t.palette.glow, textShadow: "0 1px 0 rgba(0,0,0,.6)" }}
                >
                  {k?.name.slice(0, 1)}
                </span>
                <span>
                  <span className="block whitespace-nowrap font-display text-[12px] leading-tight text-white">{pr.name}</span>
                  <span className="block whitespace-nowrap font-mono text-[8px] tracking-[0.16em] text-white/45">
                    {k?.en} · {Object.keys(pr.effects).length} FX · 段{RANKS[pr.tier ?? 1].no}
                    {pr.overdrive ? "極" : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
