"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  FolderOpen,
  LoaderCircle,
  Search,
  Trash2,
  X,
} from "lucide-react";
import PixelArt from "@/components/pixel-art";
import Modal from "@/components/ui/modal";
import { TEMPLATES, type SavedProject } from "@/lib/model-types";
import { convertBbmodel } from "@/lib/bbmodel-import";
import { useStudioStore } from "../studio-context";

function matches(project: SavedProject, query: string): boolean {
  const label =
    TEMPLATES.find((template) => template.kind === project.kind)?.label ?? "";
  return `${project.name} ${label}`.toLowerCase().includes(query.toLowerCase());
}

export default function LibraryModal() {
  const { library, closeModal, openProject, removeProject, notify } = useStudioStore();
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const importBbmodel = async (file: File) => {
    try {
      const project = convertBbmodel(JSON.parse(await file.text()), file.name);
      openProject(project);
      notify(`${project.model.cubes.length} cubes を取り込みました`, "info");
    } catch (e) {
      notify(`bbmodel の読み込みに失敗: ${String(e instanceof Error ? e.message : e)}`, "error");
    }
  };

  const visible = library.projects.filter((project) => matches(project, query));

  const confirmDelete = async (id: string) => {
    const removed = await removeProject(id);
    if (removed) setDeleteTarget(null);
  };

  return (
    <Modal
      title="マイモデル"
      eyebrow="YOUR COLLECTION"
      onClose={closeModal}
      wide
    >
      <div className="library-toolbar">
        <p>{library.projects.length}個のアイデアが、ここに。</p>
        <div className="library-search">
          <Search size={15} />
          <input
            placeholder="モデルを検索…"
            aria-label="モデルを検索"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button
              className="icon-button small"
              onClick={() => setQuery("")}
              aria-label="検索をクリア"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <label className="icon-button small" title=".bbmodel を取り込んで編集">
          <FolderOpen size={15} />
          <input
            type="file"
            accept=".bbmodel,application/json"
            className="hidden"
            aria-label=".bbmodel を取り込む"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void importBbmodel(file);
            }}
          />
        </label>
      </div>

      {library.loading ? (
        <div className="empty-state">
          <LoaderCircle className="spinning" size={28} />
          <p>モデルを読み込み中…</p>
        </div>
      ) : visible.length ? (
        <div className="library-grid">
          {visible.map((project) => (
            <div className="library-card" key={project.id}>
              <button
                className="library-card-preview"
                onClick={() => openProject(project)}
              >
                <PixelArt kind={project.kind} size={90} />
                <span>
                  モデルを開く
                  <ArrowUpRight size={13} />
                </span>
              </button>
              <div className="library-card-info">
                <button onClick={() => openProject(project)}>
                  <strong>{project.name}</strong>
                  <small>
                    {
                      TEMPLATES.find(
                        (template) => template.kind === project.kind,
                      )?.english
                    }
                    {" · "}
                    {new Date(project.updatedAt).toLocaleDateString("ja-JP")}
                  </small>
                </button>
                <button
                  className="icon-button small delete-button"
                  onClick={() => setDeleteTarget(project.id)}
                  title={`${project.name} を削除`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {deleteTarget === project.id && (
                <div className="delete-confirm">
                  <strong>このモデルを削除しますか？</strong>
                  <p>この操作は元に戻せません。</p>
                  <div>
                    <button onClick={() => setDeleteTarget(null)}>
                      キャンセル
                    </button>
                    <button
                      className="danger-button"
                      disabled={library.deleting}
                      onClick={() => void confirmDelete(project.id)}
                    >
                      {library.deleting ? "削除中…" : "削除する"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>
            <FolderOpen size={37} />
          </span>
          <h3>
            {query ? "モデルが見つかりません" : "最初のアイデアを、かたちに。"}
          </h3>
          <p>
            {query
              ? "別の名前やモデルタイプで検索してみてください。"
              : "モデルを生成すると、ここに自動で保存されます。"}
          </p>
          <button
            className="primary-button"
            onClick={() => (query ? setQuery("") : closeModal())}
          >
            {query ? "検索をクリア" : "制作をはじめる"}
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </Modal>
  );
}
