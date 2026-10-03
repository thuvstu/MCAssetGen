"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "@/lib/api-client";
import type { SavedProject } from "@/lib/model-types";
import { lastProjectStorage } from "./last-project";
import type { ToastController } from "./use-toasts";

const LIBRARY_LIMIT = 40;

export interface ProjectLibrary {
  projects: SavedProject[];
  loading: boolean;
  deleting: boolean;
  add: (project: SavedProject) => void;
  remove: (id: string) => Promise<boolean>;
}

/**
 * Loads the saved library once and restores the most recently opened project
 * through `onRestore`, which is held in a ref to avoid a circular hook graph.
 */
export function useProjects(
  notify: ToastController["notify"],
  onRestore: React.RefObject<(project: SavedProject) => void>,
): ProjectLibrary {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const restored = useRef(false);

  useEffect(() => {
    let active = true;
    api
      .listProjects()
      .then((list) => {
        if (!active) return;
        setProjects(list);
        const lastId = lastProjectStorage.read();
        const last = list.find((project) => project.id === lastId);
        if (last && !restored.current) {
          restored.current = true;
          onRestore.current?.(last);
        }
      })
      .catch((error: Error) => {
        if (active)
          notify(error.message || "モデルを読み込めませんでした。", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [notify, onRestore]);

  const add = useCallback((project: SavedProject) => {
    setProjects((current) => [project, ...current].slice(0, LIBRARY_LIMIT));
  }, []);

  const remove = useCallback(
    async (id: string) => {
      setDeleting(true);
      try {
        await api.deleteProject(id);
        setProjects((current) =>
          current.filter((project) => project.id !== id),
        );
        notify("モデルを削除しました。");
        return true;
      } catch (error) {
        notify(
          error instanceof Error ? error.message : "削除できませんでした。",
          "error",
        );
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [notify],
  );

  return { projects, loading, deleting, add, remove };
}
