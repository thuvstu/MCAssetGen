"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileBox,
  FolderOpen,
  Grid2X2,
  LayoutGrid,
  Layers,
  Plus,
} from "lucide-react";
import { ForgeLogo } from "@/components/pixel-art";
import { useStudioStore } from "./studio-context";

function SaveIndicator({ saved, dirty }: { saved: boolean; dirty: boolean }) {
  return (
    <span className={`save-indicator ${saved ? "saved" : ""}`}>
      <span />
      {dirty ? "変更あり" : saved ? "保存済み" : "プレビュー"}
    </span>
  );
}

export default function AppHeader() {
  const {
    studio,
    sidebarOpen,
    setSidebarOpen,
    openModal,
    startNewProject,
    copySettingsToClipboard,
  } = useStudioStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const runAndClose = (action: () => void) => () => {
    setMenuOpen(false);
    action();
  };

  return (
    <header className="app-header">
      <div className="brand-area">
        <button
          className="mobile-menu icon-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="サイドバーを開く"
        >
          <Grid2X2 size={19} />
        </button>
        <Link className="brand" href="/" aria-label="VoxelForge ホーム">
          <ForgeLogo />
          <span>
            Voxel<span className="brand-light">Forge</span>
          </span>
          <span className="brand-beta">BETA</span>
        </Link>
      </div>

      <div className="header-breadcrumb">
        <span className="breadcrumb-label">ワークスペース</span>
        <ChevronRight size={12} />
        <div className="project-switcher">
          <button
            className="project-name"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
          >
            <Box size={14} />
            <span>{studio.settings.name}</span>
            <ChevronDown size={12} />
          </button>
          {menuOpen && (
            <>
              <button
                className="menu-dismiss"
                aria-label="メニューを閉じる"
                onClick={() => setMenuOpen(false)}
              />
              <div className="dropdown-menu project-menu">
                <button onClick={runAndClose(startNewProject)}>
                  <Plus size={15} />
                  新規プロジェクト
                </button>
                <button onClick={runAndClose(() => openModal("rename"))}>
                  <FileBox size={15} />
                  名前を変更
                </button>
                <button onClick={runAndClose(() => openModal("library"))}>
                  <FolderOpen size={15} />
                  保存したモデルを開く
                </button>
                <div className="menu-divider" />
                <button
                  onClick={runAndClose(() => void copySettingsToClipboard())}
                >
                  <Copy size={15} />
                  生成設定をコピー
                </button>
              </div>
            </>
          )}
        </div>
        <SaveIndicator
          saved={Boolean(studio.projectId) && !studio.dirty}
          dirty={studio.dirty}
        />
      </div>

      <div className="header-actions">
        <Link className="text-button docs-button" href="/studios">
          <LayoutGrid size={15} />
          <span>スタジオ</span>
        </Link>
        <Link className="text-button docs-button" href="/engines">
          <Layers size={15} />
          <span>エンジン</span>
        </Link>
        <button
          className="text-button docs-button"
          onClick={() => openModal("help")}
        >
          <BookOpen size={15} />
          <span>使い方</span>
        </button>
        <span className="header-divider" />
        <button
          className="export-header"
          onClick={() => openModal("export")}
          disabled={studio.busy}
        >
          <Download size={15} />
          <span>エクスポート</span>
          <ChevronDown size={12} />
        </button>
        <button
          className="profile-button"
          title="ワークスペース設定"
          onClick={() => openModal("preferences")}
        >
          <span>V</span>
          <i />
        </button>
      </div>
    </header>
  );
}
