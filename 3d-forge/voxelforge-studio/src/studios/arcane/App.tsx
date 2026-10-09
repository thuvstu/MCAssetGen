"use client";

import "./studio.css";
import React from 'react';
import { Wand2, Dices, Download, RotateCcw, Lock } from 'lucide-react';
import { cn } from './utils/cn';
import { ForgeContext, useForgeState } from './hooks/useForge';
import { downloadPng } from './lib/export';

import { ElementPanel, ItemTypePanel, ModEssencePanel, RarityPanel } from './components/panels/IdentityPanels';
import { ShaftPanel, FittingsPanel } from './components/panels/BodyPanels';
import { HeadPanel, TipPanel, OrbiterPanel, GemAtelierPanel, AdornmentAtelierPanel, FinialShelf } from './components/panels/HeadPanels';
import { MotifPanel, DecorPanel, FinishPanel, AnimationPanel } from './components/panels/EffectPanels';
import {
  ExportPanel, MinecraftPackPanel, RandomRulesPanel, EffectPresetsPanel, MasterPresetsPanel,
  GuidePanel, StyleDnaPanel, HistoryPanel, ServerPackPanel,
} from './components/panels/SidePanels';
import { PalettePanel, DetailPanel, Motif2Panel, VariantSpread } from './components/panels/ForgePanels';
import { PreviewStage } from './components/PreviewStage';

type Tab = 'forge' | 'reveal' | 'atelier';

export default function App() {
  const forge = useForgeState();
  const [tab, setTab] = React.useState<Tab>('reveal');

  return (
    <ForgeContext.Provider value={forge}>
      <div className="min-h-screen bg-[#09070f] text-stone-200">
        <Ambient />
        <Header />
        <MobileTabs tab={tab} setTab={setTab} />

        <main className="relative z-10 mx-auto grid max-w-[1720px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[340px_minmax(0,1fr)_330px]">
          <aside className={cn('custom-scroll space-y-3.5 lg:block lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto lg:pr-1', tab === 'forge' ? 'block' : 'hidden lg:block')}>
            <ElementPanel />
            <ItemTypePanel />
            <RarityPanel />
            <ModEssencePanel />
            <ShaftPanel />
            <FittingsPanel />
            <HeadPanel />
            <GemAtelierPanel />
            <TipPanel />
            <FinialShelf />
            <OrbiterPanel />
            <AdornmentAtelierPanel />
            <MotifPanel />
            <Motif2Panel />
            <DecorPanel />
            <DetailPanel />
            <PalettePanel />
            <FinishPanel />
            <AnimationPanel />
          </aside>

          <section className={cn('min-w-0 space-y-4 lg:block', tab === 'reveal' ? 'block' : 'hidden lg:block')}>
            <PreviewStage />
            <VariantSpread />
            <HistoryPanel />
            <StyleDnaPanel />
          </section>

          <aside className={cn('custom-scroll space-y-3.5 lg:block lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto lg:pr-1', tab === 'atelier' ? 'block' : 'hidden lg:block')}>
            <RandomRulesPanel />
            <ExportPanel />
            <ServerPackPanel />
            <MinecraftPackPanel />
            <EffectPresetsPanel />
            <MasterPresetsPanel />
            <GuidePanel />
          </aside>
        </main>

        <Toast />
        <footer className="relative z-10 mt-4 border-t border-white/5 py-5 text-center">
          <p className="font-display text-[11px] tracking-[0.35em] text-stone-600">ARCANE FORGE · FORGED IN PIXELS · WIELD WITH GRACE</p>
        </footer>
      </div>
    </ForgeContext.Provider>
  );
}

function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="animate-drift absolute -top-48 left-1/4 h-[460px] w-[680px] rounded-full bg-violet-800/16 blur-[150px]" />
      <div className="animate-drift absolute right-[-140px] top-1/3 h-[400px] w-[440px] rounded-full bg-amber-500/9 blur-[150px]" style={{ animationDelay: '-5s' }} />
      <div className="animate-drift absolute bottom-[-180px] left-[-120px] h-[380px] w-[500px] rounded-full bg-cyan-700/10 blur-[150px]" style={{ animationDelay: '-9s' }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_38%,rgba(0,0,0,0.55)_100%)]" />
      <div className="grain-overlay absolute inset-0 opacity-[0.035]" />
    </div>
  );
}

function Header() {
  const { config, lockedCount, randomAll, reset, flash } = React.useContext(ForgeContext)!;
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0a0812]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1720px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1430] via-[#171028] to-[#0d0a18] shadow-[0_0_28px_rgba(124,58,237,0.35)] ring-1 ring-amber-200/25">
            <div className="absolute inset-[3px] rounded-lg border border-amber-200/15" />
            <Wand2 className="h-5 w-5 text-amber-200" />
            <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-200 shadow-[0_0_10px_rgba(252,211,77,0.9)]" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold leading-none tracking-[0.2em] text-transparent bg-gradient-to-r from-[#f4e3b0] via-[#e0bf72] to-[#a9884a] bg-clip-text sm:text-xl">ARCANE FORGE</h1>
            <p className="mt-1 text-[11px] tracking-wide text-stone-500">
              <span className="font-serif text-[12px] italic text-stone-400">Minecraft 魔法の杖テクスチャ工房</span>
              <span className="hidden sm:inline text-stone-600"> · 16 → 128px HD</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-stone-300 transition hover:border-white/20 hover:bg-white/8 sm:flex">
            <RotateCcw className="h-3.5 w-3.5" /> リセット
          </button>
          <button onClick={randomAll} className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-700 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_4px_24px_rgba(99,102,241,0.35)] ring-1 ring-white/10 transition hover:shadow-[0_4px_30px_rgba(99,102,241,0.55)] sm:px-4">
            <Dices className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
            <span className="hidden sm:inline">ランダム生成</span><span className="sm:hidden">Random</span>
            {lockedCount > 0 && (
              <span className="ml-0.5 flex items-center gap-0.5 rounded-md bg-amber-300 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#1a1206]" title={`${lockedCount} 項目を固定中`}>
                <Lock className="h-2.5 w-2.5" />{lockedCount}
              </span>
            )}
          </button>
          <button onClick={() => { downloadPng(config, 1); flash('PNG を保存しました'); }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e8c877] to-[#c9a24a] px-3.5 py-2 text-xs font-bold text-[#1a1206] shadow-[0_4px_24px_rgba(217,180,90,0.3)] ring-1 ring-amber-200/30 transition hover:brightness-105 sm:px-4">
            <Download className="h-4 w-4" /><span className="hidden sm:inline">PNG 保存</span><span className="sm:hidden">PNG</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileTabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div className="sticky top-[60px] z-30 flex gap-1 border-b border-white/5 bg-[#0a0812]/90 px-4 py-2 backdrop-blur lg:hidden">
      {([['forge', '調整'], ['reveal', 'プレビュー'], ['atelier', '条件・出力']] as const).map(([k, label]) => (
        <button key={k} onClick={() => setTab(k)} className={cn('flex-1 rounded-lg py-1.5 text-xs font-semibold transition', tab === k ? 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-300/30' : 'text-stone-500 hover:text-stone-300')}>{label}</button>
      ))}
    </div>
  );
}

function Toast() {
  const { toast } = React.useContext(ForgeContext)!;
  return (
    <div className={cn('pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-emerald-300/30 bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-200 shadow-lg backdrop-blur transition-all duration-300', toast ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0')}>
      {toast}
    </div>
  );
}
