"use client";

import { useMemo, useReducer } from "react";
import type { CameraView, PointerTool } from "@/components/viewport/types";

export interface ViewportState {
  grid: boolean;
  wireframe: boolean;
  autoRotate: boolean;
  tool: PointerTool;
  view: CameraView;
  zoom: number;
  /** Bumped to re-apply the camera even when the view name is unchanged. */
  resetKey: number;
  expanded: boolean;
  /** Attack/spell motion timeline. */
  actionPlaying: boolean;
  actionScrub: number;
}

export interface ViewportActions {
  toggleGrid: () => void;
  toggleWireframe: () => void;
  toggleAutoRotate: () => void;
  toggleExpanded: () => void;
  toggleActionPlaying: () => void;
  setActionScrub: (value: number) => void;
  collapse: () => void;
  setTool: (tool: PointerTool) => void;
  setView: (view: CameraView) => void;
  setZoom: (zoom: number) => void;
  zoomBy: (delta: number) => void;
  resetCamera: () => void;
  restoreDefaults: () => void;
}

export const ZOOM_LIMITS = { min: 50, max: 220, step: 10 } as const;

const INITIAL_STATE: ViewportState = {
  grid: true,
  wireframe: false,
  autoRotate: false,
  tool: "orbit",
  view: "perspective",
  zoom: 100,
  resetKey: 0,
  expanded: false,
  actionPlaying: true,
  actionScrub: 0,
};

type Action =
  | {
      type: "toggle";
      key: "grid" | "wireframe" | "autoRotate" | "expanded" | "actionPlaying";
    }
  | { type: "scrub"; value: number }
  | { type: "collapse" }
  | { type: "tool"; tool: PointerTool }
  | { type: "view"; view: CameraView }
  | { type: "zoom"; zoom: number }
  | { type: "zoomBy"; delta: number }
  | { type: "resetCamera" }
  | { type: "restoreDefaults" };

const clampZoom = (zoom: number) =>
  Math.min(ZOOM_LIMITS.max, Math.max(ZOOM_LIMITS.min, zoom));

function reducer(state: ViewportState, action: Action): ViewportState {
  switch (action.type) {
    case "toggle":
      return { ...state, [action.key]: !state[action.key] };
    case "scrub":
      // Scrubbing pauses playback so the chosen frame stays on screen.
      return {
        ...state,
        actionPlaying: false,
        actionScrub: Math.min(1, Math.max(0, action.value)),
      };
    case "collapse":
      return { ...state, expanded: false };
    case "tool":
      return { ...state, tool: action.tool };
    case "view":
      return { ...state, view: action.view };
    case "zoom":
      return { ...state, zoom: clampZoom(action.zoom) };
    case "zoomBy":
      return { ...state, zoom: clampZoom(state.zoom + action.delta) };
    case "resetCamera":
      return {
        ...state,
        view: "perspective",
        zoom: 100,
        autoRotate: false,
        resetKey: state.resetKey + 1,
      };
    case "restoreDefaults":
      return { ...INITIAL_STATE, resetKey: state.resetKey + 1 };
    default:
      return state;
  }
}

/** Display-only state of the 3D preview. */
export function useViewportState(): [ViewportState, ViewportActions] {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const actions = useMemo<ViewportActions>(
    () => ({
      toggleGrid: () => dispatch({ type: "toggle", key: "grid" }),
      toggleWireframe: () => dispatch({ type: "toggle", key: "wireframe" }),
      toggleAutoRotate: () => dispatch({ type: "toggle", key: "autoRotate" }),
      toggleExpanded: () => dispatch({ type: "toggle", key: "expanded" }),
      toggleActionPlaying: () =>
        dispatch({ type: "toggle", key: "actionPlaying" }),
      setActionScrub: (value) => dispatch({ type: "scrub", value }),
      collapse: () => dispatch({ type: "collapse" }),
      setTool: (tool) => dispatch({ type: "tool", tool }),
      setView: (view) => dispatch({ type: "view", view }),
      setZoom: (zoom) => dispatch({ type: "zoom", zoom }),
      zoomBy: (delta) => dispatch({ type: "zoomBy", delta }),
      resetCamera: () => dispatch({ type: "resetCamera" }),
      restoreDefaults: () => dispatch({ type: "restoreDefaults" }),
    }),
    [],
  );

  return [state, actions];
}
