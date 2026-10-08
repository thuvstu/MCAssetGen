"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { runPipeline, type PipelineResult } from "@/lib/analyzer/pipeline";
import { normalizeProject } from "@/lib/mod/catalog";
import type { ModProject } from "@/lib/mod/model";

export type SaveState = "saved" | "dirty" | "saving" | "error";
export type ProjectUpdate = (mutate: (draft: ModProject) => void) => void;

interface UseProjectEditorResult {
  project: ModProject | null;
  analysis: PipelineResult | null;
  missing: boolean;
  saveState: SaveState;
  update: ProjectUpdate;
  replace: (project: ModProject) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const HISTORY_LIMIT = 100;
const HISTORY_GROUP_MS = 700;
const AUTOSAVE_MS = 700;

/** Project lifecycle, history, autosave and deferred analysis. */
export function useProjectEditor(id: string): UseProjectEditorResult {
  const [project, setProject] = useState<ModProject | null>(null);
  const [missing, setMissing] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [historyVersion, setHistoryVersion] = useState(0);
  const dirty = useRef(false);
  const past = useRef<ModProject[]>([]);
  const future = useRef<ModProject[]>([]);
  const lastHistoryPush = useRef(0);

  useEffect(() => {
    let active = true;
    fetch(`/api/projects/${id}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("not found");
        return response.json() as Promise<{ data: Partial<ModProject> }>;
      })
      .then((row) => {
        if (!active) return;
        setProject(normalizeProject(row.data));
        setMissing(false);
        past.current = [];
        future.current = [];
        setHistoryVersion((v) => v + 1);
      })
      .catch(() => active && setMissing(true));
    return () => { active = false; };
  }, [id]);

  const markDirty = useCallback(() => {
    dirty.current = true;
    setSaveState("dirty");
  }, []);

  const update = useCallback<ProjectUpdate>((mutate) => {
    setProject((previous) => {
      if (!previous) return previous;
      const now = Date.now();
      if (now - lastHistoryPush.current > HISTORY_GROUP_MS) {
        past.current.push(previous);
        if (past.current.length > HISTORY_LIMIT) past.current.shift();
      }
      lastHistoryPush.current = now;
      future.current = [];
      const draft = structuredClone(previous);
      mutate(draft);
      setHistoryVersion((v) => v + 1);
      return draft;
    });
    markDirty();
  }, [markDirty]);

  const replace = useCallback((next: ModProject) => {
    setProject((previous) => {
      if (previous) past.current.push(previous);
      future.current = [];
      lastHistoryPush.current = 0;
      setHistoryVersion((v) => v + 1);
      return normalizeProject(next);
    });
    markDirty();
  }, [markDirty]);

  const undo = useCallback(() => {
    setProject((current) => {
      const previous = past.current.pop();
      if (!current || !previous) return current;
      future.current.push(current);
      lastHistoryPush.current = 0;
      setHistoryVersion((v) => v + 1);
      return previous;
    });
    if (past.current.length || project) markDirty();
  }, [markDirty, project]);

  const redo = useCallback(() => {
    setProject((current) => {
      const next = future.current.pop();
      if (!current || !next) return current;
      past.current.push(current);
      lastHistoryPush.current = 0;
      setHistoryVersion((v) => v + 1);
      return next;
    });
    if (future.current.length || project) markDirty();
  }, [markDirty, project]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const target = event.target as HTMLElement | null;
      const input = target instanceof HTMLInputElement ? target : null;
      if (target?.tagName === "TEXTAREA" || (input && input.type !== "number" && input.type !== "checkbox")) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, undo]);

  useEffect(() => {
    if (!project || !dirty.current) return;
    const timer = window.setTimeout(async () => {
      dirty.current = false;
      setSaveState("saving");
      try {
        const response = await fetch(`/api/projects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: project.meta.name, data: project }),
        });
        if (!response.ok) throw new Error(`save failed: ${response.status}`);
        setSaveState(dirty.current ? "dirty" : "saved");
      } catch {
        dirty.current = true;
        setSaveState("error");
      }
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [id, project]);

  const deferredProject = useDeferredValue(project);
  const analysis = useMemo(() => deferredProject ? runPipeline(deferredProject) : null, [deferredProject]);

  void historyVersion; // state exists to refresh canUndo/canRedo when refs change
  return {
    project,
    analysis,
    missing,
    saveState,
    update,
    replace,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
