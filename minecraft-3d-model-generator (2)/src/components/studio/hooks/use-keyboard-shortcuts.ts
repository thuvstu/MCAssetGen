"use client";

import { useEffect } from "react";

export interface ShortcutHandlers {
  /** Escape always runs, even while a dialog is open. */
  onEscape: () => void;
  onGenerate: () => void;
  onResetCamera: () => void;
  onToggleGrid: () => void;
  onToggleWireframe: () => void;
  onToggleExpanded: () => void;
}

const TEXT_INPUTS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** Editor-wide keyboard shortcuts, suspended while typing or in a dialog. */
export function useKeyboardShortcuts(
  blocked: boolean,
  handlers: ShortcutHandlers,
): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handlers.onEscape();
      const target = event.target as HTMLElement | null;
      if (blocked || (target && TEXT_INPUTS.has(target.tagName))) return;

      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        handlers.onGenerate();
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      switch (event.key.toLowerCase()) {
        case "r":
          return handlers.onResetCamera();
        case "g":
          return handlers.onToggleGrid();
        case "w":
          return handlers.onToggleWireframe();
        case "f":
          return handlers.onToggleExpanded();
        default:
          return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [blocked, handlers]);
}
