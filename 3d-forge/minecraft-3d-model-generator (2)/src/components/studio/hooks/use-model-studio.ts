"use client";
import { useCallback, useRef, useState } from "react";
import * as api from "@/lib/api-client";
import { applyCubeEdits, upsertCubeEdit } from "@/lib/editor-recipe";
import {
  normalizeSettings,
  settingsForTemplate,
  type AnimationStyle,
  type CubeEdit,
  type GeneratedModel,
  type ModelCube,
  type ModelKind,
  type ModelSettings,
  type SavedProject,
} from "@/lib/model-types";
import { lastProjectStorage } from "./last-project";
import { readAtlasFile } from "./read-atlas-file";
import type { ToastController } from "./use-toasts";

interface DocumentState {
  settings: ModelSettings;
  model: GeneratedModel;
  projectId: string | null;
  dirty: boolean;
}
export interface ModelStudio extends DocumentState {
  busy: boolean;
  selectedCube: string | null;
  canUndo: boolean;
  canRedo: boolean;
  updateSetting: <K extends keyof ModelSettings>(
    key: K,
    value: ModelSettings[K],
  ) => void;
  setAnimation: (animation: AnimationStyle) => void;
  rename: (name: string) => void;
  chooseTemplate: (kind: ModelKind) => void;
  generate: () => void;
  reset: () => void;
  applyProject: (project: SavedProject) => void;
  detachProject: () => void;
  uploadAtlas: (file: File | undefined) => Promise<void>;
  clearAtlas: () => void;
  applyPartial: (partial: Partial<ModelSettings>) => void;
  selectCube: (name: string | null) => void;
  editCube: (patch: CubeEdit) => void;
  addCube: () => void;
  duplicateCube: () => void;
  deleteCube: () => void;
  undo: () => void;
  redo: () => void;
}
interface Options {
  initialModel: GeneratedModel;
  notify: ToastController["notify"];
  onProjectSaved: (project: SavedProject) => void;
  onGenerated: () => void;
}
const HISTORY_LIMIT = 32;

/** One editor document with bounded history and an exportable, deterministic edit recipe. */
export function useModelStudio({
  initialModel,
  notify,
  onProjectSaved,
  onGenerated,
}: Options): ModelStudio {
  const [document, setDocument] = useState<DocumentState>({
    settings: normalizeSettings(initialModel.settings),
    model: initialModel,
    projectId: null,
    dirty: false,
  });
  const current = useRef(document),
    past = useRef<DocumentState[]>([]),
    future = useRef<DocumentState[]>([]);
  const [busy, setBusy] = useState(false),
    busyRef = useRef(false);
  const [selectedCube, selectCube] = useState<string | null>(null),
    selectedRef = useRef(selectedCube);
  selectedRef.current = selectedCube;
  const set = useCallback((next: DocumentState, history = true) => {
    if (history) {
      past.current = [
        ...past.current.slice(-(HISTORY_LIMIT - 1)),
        current.current,
      ];
      future.current = [];
    }
    current.current = next;
    setDocument(next);
  }, []);
  const run = useCallback(
    async (settings: ModelSettings, persist: boolean) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        const { model, project } = await api.requestModel(settings, persist);
        set({
          settings: model.settings,
          model,
          projectId: project?.id ?? null,
          dirty: !persist,
        });
        onGenerated();
        if (project) {
          onProjectSaved(project);
          lastProjectStorage.write(project.id);
          notify("モデルと編集内容を保存しました。");
        }
      } catch (error) {
        notify(
          error instanceof Error ? error.message : "生成できませんでした。",
          "error",
        );
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [notify, onGenerated, onProjectSaved, set],
  );
  const updateSetting = useCallback<ModelStudio["updateSetting"]>(
    (key, value) => {
      if (busyRef.current) return;
      const state = current.current;
      set({
        ...state,
        settings: { ...state.settings, [key]: value },
        dirty: true,
      });
    },
    [set],
  );
  const setAnimation = useCallback(
    (animation: AnimationStyle) => {
      const state = current.current;
      set({
        ...state,
        settings: {
          ...state.settings,
          animation,
          floaters:
            animation !== "none" && state.settings.floaters === "none"
              ? "crystal"
              : state.settings.floaters,
        },
        dirty: true,
      });
    },
    [set],
  );
  const applyPartial = useCallback(
    (partial: Partial<ModelSettings>) => {
      if (busyRef.current) return;
      const state = current.current,
        next = { ...state.settings, ...partial };
      set({ ...state, settings: next, dirty: true });
      void run(next, false);
    },
    [run, set],
  );
  const chooseTemplate = useCallback(
    (kind: ModelKind) => {
      if (busyRef.current) return;
      selectCube(null);
      const state = current.current,
        next = settingsForTemplate(kind, state.settings);
      set({ ...state, settings: next, dirty: true });
      void run(next, false);
    },
    [run, set],
  );
  const generate = useCallback(() => {
    void run(current.current.settings, true);
  }, [run]);
  const reset = useCallback(() => {
    if (busyRef.current) return;
    set({
      settings: normalizeSettings(initialModel.settings),
      model: initialModel,
      projectId: null,
      dirty: false,
    });
    selectCube(null);
    lastProjectStorage.clear();
    notify("新しいモデルの制作をはじめましょう。", "info");
  }, [initialModel, notify, set]);
  const applyProject = useCallback(
    (project: SavedProject) => {
      if (busyRef.current) return;
      const settings = normalizeSettings(project.settings);
      set({
        settings,
        model: { ...project.model, settings },
        projectId: project.id,
        dirty: false,
      });
      selectCube(null);
      lastProjectStorage.write(project.id);
    },
    [set],
  );
  const detachProject = useCallback(() => {
    set({ ...current.current, projectId: null }, false);
    lastProjectStorage.clear();
  }, [set]);
  const rename = useCallback(
    (name: string) => {
      const state = current.current;
      set({
        ...state,
        settings: { ...state.settings, name },
        model: { ...state.model, settings: { ...state.model.settings, name } },
        dirty: true,
      });
    },
    [set],
  );
  const uploadAtlas = useCallback(
    async (file: File | undefined) => {
      if (!file || busyRef.current) return;
      try {
        const atlas = await readAtlasFile(file);
        applyPartial({ atlas });
      } catch (error) {
        notify(
          error instanceof Error
            ? error.message
            : "画像を読み込めませんでした。",
          "error",
        );
      }
    },
    [applyPartial, notify],
  );
  const clearAtlas = useCallback(
    () => applyPartial({ atlas: undefined }),
    [applyPartial],
  );
  const editCube = useCallback(
    (patch: CubeEdit) => {
      if (busyRef.current) return;
      const state = current.current,
        edits = upsertCubeEdit(state.settings.edits ?? [], patch);
      const settings = { ...state.settings, edits };
      set({
        ...state,
        settings,
        model: {
          ...state.model,
          cubes: applyCubeEdits(state.model.cubes, [patch]),
          settings: { ...state.model.settings, edits },
        },
        dirty: true,
      });
    },
    [set],
  );
  const addCustom = useCallback(
    (cube: ModelCube) => {
      const state = current.current,
        customCubes = [...(state.settings.customCubes ?? []), cube];
      if (customCubes.length > 128) {
        notify("追加キューブは128個までです。", "error");
        return;
      }
      const settings = { ...state.settings, customCubes };
      set({
        ...state,
        settings,
        model: {
          ...state.model,
          cubes: [...state.model.cubes, cube],
          settings: { ...state.model.settings, customCubes },
        },
        dirty: true,
      });
      selectCube(cube.name);
    },
    [notify, set],
  );
  const addCube = useCallback(() => {
    if (busyRef.current) return;
    addCustom({
      name: `custom_${crypto.randomUUID()}`,
      label: "追加キューブ",
      from: [-1, -1, 2],
      to: [1, 1, 4],
      color: current.current.model.palette[3],
      material: 3,
      uv: [2, 2, 14, 10],
      painted: true,
    });
  }, [addCustom]);
  const duplicateCube = useCallback(() => {
    if (busyRef.current) return;
    const cube = current.current.model.cubes.find(
      (c) => c.name === selectedRef.current,
    );
    if (!cube) return;
    const offset = cube.to[0] > 22 ? -1 : 1;
    addCustom({
      ...cube,
      name: `custom_${crypto.randomUUID()}`,
      label: `${cube.label ?? cube.name} のコピー`,
      from: cube.from.map(
        (n, i) => n + (i === 0 ? offset : 0),
      ) as ModelCube["from"],
      to: cube.to.map((n, i) => n + (i === 0 ? offset : 0)) as ModelCube["to"],
      painted: true,
      hidden: false,
    });
  }, [addCustom]);
  const deleteCube = useCallback(() => {
    const state = current.current,
      name = selectedRef.current;
    if (!name) return;
    if (name.startsWith("custom_")) {
      const customCubes = (state.settings.customCubes ?? []).filter(
          (c) => c.name !== name,
        ),
        edits = (state.settings.edits ?? []).filter((e) => e.target !== name);
      const settings = { ...state.settings, customCubes, edits };
      set({
        ...state,
        settings,
        model: {
          ...state.model,
          cubes: state.model.cubes.filter((c) => c.name !== name),
          settings: { ...state.model.settings, customCubes, edits },
        },
        dirty: true,
      });
    } else editCube({ target: name, hidden: true });
    selectCube(null);
  }, [editCube, set]);
  const undo = useCallback(() => {
    if (busyRef.current || !past.current.length) return;
    const next = past.current.pop()!;
    future.current.push(current.current);
    set(next, false);
    selectCube(null);
  }, [set]);
  const redo = useCallback(() => {
    if (busyRef.current || !future.current.length) return;
    const next = future.current.pop()!;
    past.current.push(current.current);
    set(next, false);
    selectCube(null);
  }, [set]);
  return {
    ...document,
    busy,
    selectedCube,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    updateSetting,
    setAnimation,
    rename,
    chooseTemplate,
    generate,
    reset,
    applyProject,
    detachProject,
    uploadAtlas,
    clearAtlas,
    applyPartial,
    selectCube,
    editCube,
    addCube,
    duplicateCube,
    deleteCube,
    undo,
    redo,
  };
}
