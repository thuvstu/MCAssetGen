"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { ACTIONS, isActiveAction } from "@/lib/animation/actions";
import type { ActionStyle } from "@/lib/model-types";
import { useStudioStore } from "./studio-context";
export default function ActionPlayer({ action }: { action: ActionStyle }) {
  const { viewport, viewportActions } = useStudioStore();
  const [progress, setProgress] = useState(0),
    latest = useRef(0);
  useEffect(() => {
    const update = (event: Event) => {
      const value = (event as CustomEvent<{ progress: number }>).detail
        .progress;
      latest.current = value;
      setProgress(value);
    };
    document.addEventListener("voxel-motion-time", update);
    return () => document.removeEventListener("voxel-motion-time", update);
  }, []);
  if (!isActiveAction(action)) return null;
  const definition = ACTIONS[action],
    value = viewport.actionPlaying ? progress : viewport.actionScrub;
  return (
    <div className="action-player" aria-label="発動モーションのタイムライン">
      <button
        className="action-play"
        onClick={() =>
          viewport.actionPlaying
            ? viewportActions.setActionScrub(latest.current)
            : viewportActions.toggleActionPlaying()
        }
        aria-label={
          viewport.actionPlaying ? "モーションを一時停止" : "モーションを再生"
        }
      >
        {viewport.actionPlaying ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <span className="action-name">{definition.label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        aria-label="モーションの時間"
        onChange={(e) => viewportActions.setActionScrub(Number(e.target.value))}
        style={{ "--range-progress": `${value * 100}%` } as CSSProperties}
      />
      <span className="action-time">
        {(value * definition.length).toFixed(2)}s
      </span>
    </div>
  );
}
