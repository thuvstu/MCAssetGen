"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ExportController } from "./hooks/use-export";
import type { ModelStudio } from "./hooks/use-model-studio";
import type { ProjectLibrary } from "./hooks/use-projects";
import type { Toast, ToastController } from "./hooks/use-toasts";
import type {
  ViewportActions,
  ViewportState,
} from "./hooks/use-viewport-state";
import { useExport } from "./hooks/use-export";
import { useModelStudio } from "./hooks/use-model-studio";
import { useProjects } from "./hooks/use-projects";
import { useToasts } from "./hooks/use-toasts";
import { useViewportState } from "./hooks/use-viewport-state";
import type { GeneratedModel, SavedProject } from "@/lib/model-types";

export type ModalName =
  "export" | "library" | "help" | "rename" | "preferences" | null;
export type EditorTab = "preview" | "uv" | "variants";
export type InspectorTab = "generator" | "finish" | "edit";

export interface StudioStore {
  studio: ModelStudio;
  library: ProjectLibrary;
  exporter: ExportController;
  viewport: ViewportState;
  viewportActions: ViewportActions;
  toast: Toast | null;
  notify: ToastController["notify"];
  dismissToast: () => void;
  modal: ModalName;
  openModal: (modal: Exclude<ModalName, null>) => void;
  closeModal: () => void;
  inspectorTab: InspectorTab;
  setInspectorTab: (tab: InspectorTab) => void;
  tab: EditorTab;
  setTab: (tab: EditorTab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  /** Opens a saved project and returns the editor to a clean state. */
  openProject: (project: SavedProject) => void;
  /** Deletes a project and detaches it if it is the one being edited. */
  removeProject: (id: string) => Promise<boolean>;
  startNewProject: () => void;
  downloadCurrentModel: () => Promise<void>;
  copySettingsToClipboard: () => Promise<void>;
}

const StudioContext = createContext<StudioStore | null>(null);

export function useStudioStore(): StudioStore {
  const store = useContext(StudioContext);
  if (!store)
    throw new Error("useStudioStore must be used inside <StudioProvider>");
  return store;
}

export function StudioProvider({
  initialModel,
  children,
}: {
  initialModel: GeneratedModel;
  children: ReactNode;
}) {
  const { toast, notify, dismiss } = useToasts();
  const [viewport, viewportActions] = useViewportState();
  const [modal, setModal] = useState<ModalName>(null);
  const [tab, setTab] = useState<EditorTab>("preview");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("generator");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const restoreProject = useRef<(project: SavedProject) => void>(() => {});
  const library = useProjects(notify, restoreProject);
  const exporter = useExport(notify);

  const showPreview = useCallback(() => setTab("preview"), []);
  const studio = useModelStudio({
    initialModel,
    notify,
    onProjectSaved: library.add,
    onGenerated: showPreview,
  });
  restoreProject.current = studio.applyProject;

  const openModal = useCallback(
    (next: Exclude<ModalName, null>) => setModal(next),
    [],
  );
  const closeModal = useCallback(() => setModal(null), []);

  const openProject = useCallback(
    (project: SavedProject) => {
      studio.applyProject(project);
      setModal(null);
      setSidebarOpen(false);
      setTab("preview");
      viewportActions.resetCamera();
      notify(`${project.name} を開きました。`, "info");
    },
    [notify, studio, viewportActions],
  );

  const removeProject = useCallback(
    async (id: string) => {
      const removed = await library.remove(id);
      if (removed && studio.projectId === id) studio.detachProject();
      return removed;
    },
    [library, studio],
  );

  const startNewProject = useCallback(() => {
    studio.reset();
    setModal(null);
    setTab("preview");
    viewportActions.resetCamera();
  }, [studio, viewportActions]);

  const downloadCurrentModel = useCallback(async () => {
    const saved = await exporter.download(studio.model.settings);
    if (saved) setModal(null);
  }, [exporter, studio.model.settings]);

  const copySettingsToClipboard = useCallback(async () => {
    const { atlas, ...rest } = studio.settings;
    const payload = {
      ...rest,
      atlas: atlas
        ? { name: atlas.name, width: atlas.width, height: atlas.height }
        : undefined,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      notify("生成設定をクリップボードにコピーしました。");
    } catch {
      notify("クリップボードへのアクセスが許可されていません。", "error");
    }
  }, [notify, studio.settings]);

  const value = useMemo<StudioStore>(
    () => ({
      studio,
      library,
      exporter,
      viewport,
      viewportActions,
      toast,
      notify,
      dismissToast: dismiss,
      modal,
      openModal,
      closeModal,
      inspectorTab,
      setInspectorTab,
      tab,
      setTab,
      sidebarOpen,
      setSidebarOpen,
      openProject,
      removeProject,
      startNewProject,
      downloadCurrentModel,
      copySettingsToClipboard,
    }),
    [
      studio,
      library,
      exporter,
      viewport,
      viewportActions,
      toast,
      notify,
      dismiss,
      modal,
      openModal,
      closeModal,
      tab,
      inspectorTab,
      sidebarOpen,
      openProject,
      removeProject,
      startNewProject,
      downloadCurrentModel,
      copySettingsToClipboard,
    ],
  );

  return (
    <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
  );
}
