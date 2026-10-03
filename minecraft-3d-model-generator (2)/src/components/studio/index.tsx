"use client";

import { useEffect, useMemo } from "react";
import ToastMessage from "@/components/ui/toast-message";
import type { GeneratedModel } from "@/lib/model-types";
import AppHeader from "./app-header";
import EditorPane from "./editor-pane";
import {
  useKeyboardShortcuts,
  type ShortcutHandlers,
} from "./hooks/use-keyboard-shortcuts";
import ModalHost from "./modals";
import SettingsPanel from "./settings-panel";
import Sidebar from "./sidebar";
import StatusBar from "./status-bar";
import { StudioProvider, useStudioStore } from "./studio-context";

function StudioLayout() {
  const {
    studio,
    viewportActions,
    toast,
    dismissToast,
    modal,
    setSidebarOpen,
  } = useStudioStore();

  const shortcuts = useMemo<ShortcutHandlers>(
    () => ({
      onEscape: () => {
        viewportActions.collapse();
        setSidebarOpen(false);
      },
      onGenerate: studio.generate,
      onResetCamera: viewportActions.resetCamera,
      onToggleGrid: viewportActions.toggleGrid,
      onToggleWireframe: viewportActions.toggleWireframe,
      onToggleExpanded: viewportActions.toggleExpanded,
    }),
    [setSidebarOpen, studio.generate, viewportActions],
  );

  useEffect(() => {
    const onEditKey = (event: KeyboardEvent) => {
      if (
        modal ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (event.target as HTMLElement)?.tagName,
        )
      )
        return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        event.shiftKey ? studio.redo() : studio.undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        studio.redo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        studio.duplicateCube();
      }
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        studio.selectedCube
      ) {
        event.preventDefault();
        studio.deleteCube();
      }
    };
    window.addEventListener("keydown", onEditKey);
    return () => window.removeEventListener("keydown", onEditKey);
  }, [modal, studio]);

  useKeyboardShortcuts(modal !== null, shortcuts);

  return (
    <div className="studio-app">
      <AppHeader />
      <div className="workspace-layout">
        <Sidebar />
        <EditorPane />
        <SettingsPanel />
      </div>
      <StatusBar />
      {toast && <ToastMessage toast={toast} onDismiss={dismissToast} />}
      <ModalHost />
    </div>
  );
}

export default function Studio({
  initialModel,
}: {
  initialModel: GeneratedModel;
}) {
  return (
    <StudioProvider initialModel={initialModel}>
      <StudioLayout />
    </StudioProvider>
  );
}
