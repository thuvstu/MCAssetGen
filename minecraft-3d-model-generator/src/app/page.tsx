"use client";
import dynamic from "next/dynamic";
import { useEffect, type CSSProperties } from "react";
import ForgeProvider, { useDerived } from "@/components/ForgeProvider";
import LeftRail from "@/components/LeftRail";
import AtlasSheet from "@/components/right/AtlasSheet";
import ExportPanel from "@/components/right/ExportPanel";
import LibraryPanel from "@/components/right/LibraryPanel";
import { kindById, prefersReducedMotion } from "@/lib/forge";
import StageBoundary from "@/components/stage/StageBoundary";
import { useForge, type ViewKey } from "@/lib/store";

const Stage = dynamic(() => import("@/components/stage/Stage"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-stage">
      <span className="font-mono text-[10px] tracking-[0.3em] text-white/40">LOADING STAGE…</span>
    </div>
  ),
});

const PAPER: CSSProperties = {
  backgroundImage: "url(/images/washi.jpg)",
  backgroundSize: "440px",
  backgroundColor: "#EFE9DD",
  backgroundBlendMode: "multiply",
};

function Mark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] shrink-0" aria-hidden>
      <rect width="24" height="24" fill="#15130F" />
      <g fill="#EFE9DD">
        {[3, 8, 13, 18].map((x) => (
          <rect key={`t${x}`} x={x} y="3" width={x === 18 ? 3 : 4} height="4" />
        ))}
        {[3, 8, 13, 18].map((x) => (
          <rect key={`b${x}`} x={x} y="18" width={x === 18 ? 3 : 4} height="3" />
        ))}
        <rect x="3" y="8" width="4" height="4" />
        <rect x="3" y="13" width="4" height="4" />
        <rect x="18" y="8" width="3" height="4" />
        <rect x="18" y="13" width="3" height="4" />
      </g>
      <path d="M4.5 19.5 L19.5 4.5 L19.5 8 L8 19.5 Z" fill="#D9482B" />
    </svg>
  );
}

function Item({ k, v, hide, red }: { k: string; v: string; hide?: string; red?: boolean }) {
  return (
    <span className={`${hide ?? "flex"} items-baseline gap-1.5`}>
      <span className="text-ink/60">{k}</span>
      <span className={`tabular-nums ${red ? "text-vermilion" : "text-ink"}`}>{v}</span>
    </span>
  );
}

function Header() {
  const { gen, atlas } = useDerived();
  const p = useForge((s) => s.params);
  const undo = useForge((s) => s.undo);
  const redo = useForge((s) => s.redo);
  const canUndo = useForge((s) => s.history.length > 0);
  const canRedo = useForge((s) => s.future.length > 0);
  const reset = useForge((s) => s.reset);
  const k = kindById(p.kind);
  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-ink/30 px-3" style={PAPER}>
      <Mark />
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="whitespace-nowrap font-display text-[13px] tracking-[0.16em] text-ink sm:text-[15px] sm:tracking-[0.3em]">UV ATLAS FORGE</span>
        <span className="hidden text-[11px] tracking-[0.2em] text-ink/60 md:inline">型押し工房 · 弐</span>
      </div>
      <div className="ml-2 hidden items-center border border-ink/30 sm:flex">
        <button type="button" onClick={undo} disabled={!canUndo} title="戻す（⌘Z）" className="px-2 py-0.5 text-[12px] text-ink hover:bg-ink hover:text-paper disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink">
          ↶
        </button>
        <button type="button" onClick={redo} disabled={!canRedo} title="やり直す（⇧⌘Z）" className="border-l border-ink/30 px-2 py-0.5 text-[12px] text-ink hover:bg-ink hover:text-paper disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink">
          ↷
        </button>
        <button type="button" onClick={reset} title="この型を初期化" className="border-l border-ink/30 px-2 py-0.5 text-[10px] tracking-[0.1em] text-ink/75 hover:bg-ink hover:text-paper">
          初期化
        </button>
      </div>
      <div className="ml-auto flex items-center gap-3 font-mono text-[10px] tracking-[0.14em] sm:gap-5">
        <Item k="TYPE" v={`${k.en}·${k.styles[p.style]?.sub ?? ""}`} hide="hidden lg:flex" />
        <Item k="ELM" v={String(gen.boxes.length).padStart(3, "0")} />
        <Item k="FX" v={String(gen.fxCount).padStart(3, "0")} hide="hidden sm:flex" red />
        <Item k="TEX" v={`${atlas.size}px`} hide="hidden md:flex" />
        <Item k="UV" v={`${Math.round(atlas.fill * 100)}%`} hide="hidden xl:flex" />
        {p.view.phantom > 0 && (
          <span className="flex items-baseline gap-1.5">
            <span className="text-ink/60">幻影</span>
            <span className="text-vermilion tabular-nums">{p.view.phantom}</span>
          </span>
        )}
      </div>
    </header>
  );
}

function Toast() {
  const toast = useForge((s) => s.toast);
  const clear = useForge.setState;
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => clear({ toast: null }), 3200);
    return () => clearTimeout(t);
  }, [toast, clear]);
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2">
      <div key={toast.id} role="status" className="animate-[fadeup_0.18s_ease-out] border border-ink bg-paper px-3 py-1.5 text-[11px] tracking-wide text-ink shadow-[3px_3px_0_rgba(0,0,0,0.45)]">
        {toast.msg}
      </div>
    </div>
  );
}

function GlobalKeys() {
  // モーション軽減設定なら、初回は自動再生を伏せる（手動再生は可能）
  useEffect(() => {
    if (!prefersReducedMotion()) return;
    const s = useForge.getState();
    s.set({ anim: { ...s.params.anim, on: false } }, { silent: true });
    s.say("モーション軽減設定のため、待機再生を停止しています");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      const s = useForge.getState();
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        s.redo();
      } else if (e.key === " ") {
        e.preventDefault();
        s.setDeep("anim", { on: !s.params.anim.on });
      } else if (!mod && ["1", "2", "3", "4"].includes(e.key)) {
        const v: ViewKey[] = ["persp", "front", "side", "top"];
        s.setView(v[Number(e.key) - 1]);
      } else if (!mod) {
        const key = e.key.toLowerCase();
        const clips: Record<string, string> = { a: "attack", s: "cast", d: "transform", f: "guard" };
        if (clips[key]) {
          e.preventDefault();
          s.play(clips[key]);
        } else if (key === "p") {
          const on = s.params.view.phantom > 0;
          s.setDeep("view", { phantom: on ? 0 : 3 });
          s.say(on ? "幻影を解きました" : "幻影を三本走らせました");
        } else if (key === "+" || key === "=") {
          if (s.params.tier < 5) s.morph({ tier: s.params.tier + 1 });
        } else if (key === "-") {
          if (s.params.tier > 0) s.morph({ tier: s.params.tier - 1, overdrive: false });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}

export default function Home() {
  return (
    <ForgeProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-stage font-sans text-ink">
        <Header />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <aside className="order-2 w-full shrink-0 border-t border-ink/25 lg:order-1 lg:h-full lg:w-[348px] lg:overflow-y-auto lg:border-r lg:border-t-0 lg:shadow-[10px_0_26px_rgba(0,0,0,0.55)]" style={PAPER}>
            <LeftRail />
          </aside>
          <section className="relative order-1 h-[58vh] min-h-[360px] shrink-0 lg:order-2 lg:h-auto lg:min-h-0 lg:flex-1 lg:shrink">
            <StageBoundary>
              <Stage />
            </StageBoundary>
          </section>
          <aside className="order-3 w-full shrink-0 border-t border-ink/25 lg:h-full lg:w-[360px] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:shadow-[-10px_0_26px_rgba(0,0,0,0.55)]" style={PAPER}>
            <div className="px-4 pt-4">
              <AtlasSheet />
            </div>
            <ExportPanel />
            <div className="pb-16">
              <LibraryPanel />
            </div>
          </aside>
        </main>
        <Toast />
        <GlobalKeys />
      </div>
    </ForgeProvider>
  );
}
