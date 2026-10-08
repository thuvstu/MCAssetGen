"use client";

import { useEffect } from "react";
import type { Tool } from "@/studios/adv/components/editor/PixelCanvas";

type ShortcutOptions = {
  frameCount: number;
  onTool: (tool: Tool) => void;
  onBrushDelta: (delta: number) => void;
  onZoomDelta: (delta: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onPlayback: () => void;
  onNextFrame: () => void;
  onPreviousFrame: () => void;
  onToggle3D: () => void;
  onEditMode: () => void;
};

const TOOL_KEYS: Record<string, Tool> = {
  b: "pencil",
  e: "eraser",
  g: "fill",
  i: "picker",
  l: "line",
  r: "rect",
  o: "ellipse",
  d: "gradient",
  m: "select",
};

const isEditable = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  return !!element && (element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName));
};

export function useEditorShortcuts(options: ShortcutOptions) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isEditable(event.target)) return;
      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && key === "z") {
        event.preventDefault();
        if (event.shiftKey) options.onRedo(); else options.onUndo();
        return;
      }
      if (modifier && key === "y") {
        event.preventDefault();
        options.onRedo();
        return;
      }
      const tool = TOOL_KEYS[key];
      if (tool) {
        options.onTool(tool);
        options.onEditMode();
        return;
      }
      if (key === "[") options.onBrushDelta(-1);
      if (key === "]") options.onBrushDelta(1);
      if (key === "+" || key === "=") options.onZoomDelta(2);
      if (key === "-") options.onZoomDelta(-2);
      if (key === " ") {
        event.preventDefault();
        options.onPlayback();
      }
      if (key === "arrowright") options.onNextFrame();
      if (key === "arrowleft") options.onPreviousFrame();
      if (key === "3") options.onToggle3D();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [options]);
}
