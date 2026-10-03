"use client";

import React from "react";
import { Studio } from "@/lib/state/useStudioState";
import { Dices, FolderOpen, Save, Download, Undo2, Redo2 } from "lucide-react";

interface Props {
  studio: Studio;
  onExport: () => void;
  onSave: () => void;
  onVault: () => void;
}

export function Header({ studio, onExport, onSave, onVault }: Props) {
  const { undo, redo, canUndo, canRedo, randomize } = studio;

  return (
    <header className="relative z-30 flex h-[54px] items-center gap-5 border-b border-line bg-panel px-4 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.18] mix-blend-overlay"
        style={{ backgroundImage: "url(images/panel-metal.jpg)" }}
        aria-hidden
      />

      {/* mark */}
      <div className="relative flex items-baseline gap-2.5">
        <svg viewBox="0 0 28 28" className="h-[22px] w-[22px] self-center" aria-hidden>
          <rect x="1.5" y="1.5" width="25" height="25" fill="none" stroke="#e2622c" strokeWidth="1.2" />
          <path d="M14 4 L18.5 14 L14 24 L9.5 14 Z" fill="#e2622c" />
          <path d="M14 4 L18.5 14 L14 14 Z" fill="#ffb48c" />
          <rect x="4" y="13.2" width="20" height="1.2" fill="#7fd7cd" />
        </svg>
        <div className="leading-none">
          <span className="font-latin text-[15px] font-bold tracking-[0.22em] text-bone">
            FORGE
          </span>
          <span className="font-latin text-[15px] font-bold tracking-[0.22em] text-ember">3D</span>
        </div>
        <span className="lbl hidden pl-2 sm:block">BLOCKBENCH STUDIO</span>
      </div>

      <div className="relative ml-auto flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="元に戻す ⌘Z"
          className="p-2 text-ash transition-colors hover:text-bone disabled:opacity-25"
        >
          <Undo2 className="h-[15px] w-[15px]" strokeWidth={1.5} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="やり直す ⇧⌘Z"
          className="p-2 text-ash transition-colors hover:text-bone disabled:opacity-25"
        >
          <Redo2 className="h-[15px] w-[15px]" strokeWidth={1.5} />
        </button>

        <span className="mx-2 h-4 w-px bg-line" />

        <button onClick={randomize} title="おまかせ生成 (R)" className="act hidden sm:inline-flex">
          <Dices className="h-[13px] w-[13px]" strokeWidth={1.5} />
          生成
          <span className="lbl pl-1 opacity-60">R</span>
        </button>

        <button onClick={onVault} title="蔵 (保存済みモデル)">
          <span className="act">
            <FolderOpen className="h-[13px] w-[13px]" strokeWidth={1.5} />
            蔵
          </span>
        </button>

        <button onClick={onSave} title="保存 (S)">
          <span className="act">
            <Save className="h-[13px] w-[13px]" strokeWidth={1.5} />
            保存
          </span>
        </button>

        <button onClick={onExport} className="btn btn-solid ml-3" title="エクスポート (E)">
          <Download className="h-[13px] w-[13px]" strokeWidth={2} />
          出力
        </button>
      </div>
    </header>
  );
}
