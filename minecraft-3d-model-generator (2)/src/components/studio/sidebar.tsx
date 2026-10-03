"use client";

import {
  ArrowUpRight,
  Box,
  Check,
  FolderClosed,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import PixelArt from "@/components/pixel-art";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATES,
  type SavedProject,
  type Template,
  type TemplateCategory,
} from "@/lib/model-types";
import { useStudioStore } from "./studio-context";

const SAMPLE_TEMPLATES = [TEMPLATES[0], TEMPLATES[2], TEMPLATES[3]];
const RECENT_LIMIT = 3;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

function RecentEntry({
  kind,
  title,
  subtitle,
  current,
  disabled,
  onClick,
}: {
  kind: SavedProject["kind"];
  title: string;
  subtitle: string;
  current: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`recent-model ${current ? "is-current" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="recent-thumbnail">
        <PixelArt kind={kind} size={29} />
      </span>
      <span className="recent-model-copy">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      {current && <span className="recent-dot" />}
    </button>
  );
}

export default function Sidebar() {
  const {
    studio,
    library,
    sidebarOpen,
    setSidebarOpen,
    openModal,
    startNewProject,
    openProject,
  } = useStudioStore();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const templates = TEMPLATES.filter(
    (t) =>
      (category === "all" || t.category === category) &&
      `${t.label} ${t.english} ${t.name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  const pickTemplate = (template: Template) => {
    studio.chooseTemplate(template.kind);
    setSidebarOpen(false);
  };

  return (
    <>
      {sidebarOpen && (
        <button
          className="sidebar-scrim"
          aria-label="サイドバーを閉じる"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-main">
          <div className="section-eyebrow">WORKSPACE</div>
          <nav className="main-navigation" aria-label="メインナビゲーション">
            <button
              className="nav-item active"
              onClick={() => setSidebarOpen(false)}
            >
              <Box size={17} />
              <span>モデルスタジオ</span>
              <span className="nav-active-dot" />
            </button>
            <button
              className="nav-item"
              onClick={() => {
                openModal("library");
                setSidebarOpen(false);
              }}
            >
              <FolderClosed size={17} />
              <span>マイモデル</span>
              <span className="nav-count">
                {library.projects.length.toString().padStart(2, "0")}
              </span>
            </button>
          </nav>

          <div className="sidebar-separator" />
          <div className="section-heading">
            <h2>テンプレート</h2>
            <span className="tiny-count">
              {TEMPLATES.length.toString().padStart(2, "0")}
            </span>
          </div>
          <p className="section-description">
            {TEMPLATES.length}種類。世界観から選ぼう。
          </p>
          <div className="template-search">
            <Search size={12} />
            <input
              aria-label="テンプレートを検索"
              placeholder="名前・武器種で検索…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                aria-label="テンプレート検索をクリア"
                onClick={() => setQuery("")}
              >
                <X size={11} />
              </button>
            )}
          </div>
          <div className="template-categories">
            <button
              className={category === "all" ? "selected" : ""}
              onClick={() => setCategory("all")}
            >
              すべて
            </button>
            {TEMPLATE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={category === c.id ? "selected" : ""}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="template-grid">
            {templates.map((template) => {
              const selected = studio.settings.kind === template.kind;
              return (
                <button
                  key={template.kind}
                  className={`template-card ${selected ? "selected" : ""}`}
                  onClick={() => pickTemplate(template)}
                  disabled={studio.busy}
                  aria-pressed={selected}
                  title={`${template.label}のモデルを作る`}
                >
                  {selected && (
                    <span className="template-check">
                      <Check size={8} strokeWidth={3} />
                    </span>
                  )}
                  <PixelArt kind={template.kind} size={43} />
                  <span>{template.label}</span>
                </button>
              );
            })}
          </div>

          {templates.length === 0 && (
            <p className="template-empty">一致するテンプレートはありません。</p>
          )}
          <div className="sidebar-separator recent-separator" />
          <div className="section-heading">
            <h2>最近のモデル</h2>
            <button
              className="icon-button small"
              onClick={() => openModal("library")}
              title="すべてのモデルを見る"
            >
              <MoreHorizontal size={17} />
            </button>
          </div>
          <div className="recent-models">
            {library.projects.length > 0
              ? library.projects
                  .slice(0, RECENT_LIMIT)
                  .map((project) => (
                    <RecentEntry
                      key={project.id}
                      kind={project.kind}
                      title={project.name}
                      subtitle={`${formatDate(project.updatedAt)} · 保存済み`}
                      current={studio.projectId === project.id}
                      disabled={studio.busy}
                      onClick={() => openProject(project)}
                    />
                  ))
              : SAMPLE_TEMPLATES.map((template, index) => (
                  <RecentEntry
                    key={template.kind}
                    kind={template.kind}
                    title={template.name}
                    subtitle={
                      index === 0 ? "スターターモデル" : "サンプルプロジェクト"
                    }
                    current={studio.settings.kind === template.kind}
                    disabled={studio.busy}
                    onClick={() => pickTemplate(template)}
                  />
                ))}
          </div>
          <button
            className="new-model-button"
            onClick={startNewProject}
            disabled={studio.busy}
          >
            <Plus size={14} />
            新規モデル
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="creator-note">
            <div className="creator-note-top">
              <span className="note-sparkle">
                <Sparkles size={16} />
              </span>
              <span>
                小さなピクセルから、
                <br />
                無限の世界へ。
              </span>
            </div>
            <p>はじめてのモデルを作ってみよう。</p>
            <button onClick={() => openModal("help")}>
              クイックスタートガイド
              <ArrowUpRight size={13} />
            </button>
            <div className="note-decoration" />
          </div>
          <div className="sidebar-footer">
            <span>
              <i />
              パーソナルワークスペース
            </span>
            <button
              className="icon-button small"
              title="表示設定"
              onClick={() => openModal("preferences")}
            >
              <Settings2 size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
