"use client";

import { useCallback, useRef, useState } from "react";
import { clonePix, makePix, type Pix } from "@/studios/adv/lib/pixel/core";

export type Timeline = {
  frames: Pix[];
  currentFrame: number;
};

export type FrameOperation =
  | "add"
  | "duplicate"
  | "delete"
  | "moveLeft"
  | "moveRight"
  | "single"
  | "reverse"
  | "pingPong";

const cloneTimeline = (timeline: Timeline): Timeline => ({
  frames: timeline.frames.map(clonePix),
  currentFrame: timeline.currentFrame,
});

const clampFrame = (frame: number, count: number) => Math.max(0, Math.min(count - 1, frame));

/** Immutable timeline state plus bounded, pixel-safe undo/redo history. */
export function useFrameTimeline(initialFrame: Pix, maxHistory = 60) {
  const [timeline, setTimeline] = useState<Timeline>(() => ({ frames: [clonePix(initialFrame)], currentFrame: 0 }));
  const past = useRef<Timeline[]>([]);
  const future = useRef<Timeline[]>([]);

  const snapshot = useCallback((current: Timeline) => {
    past.current.push(cloneTimeline(current));
    if (past.current.length > maxHistory) past.current.shift();
    future.current = [];
  }, [maxHistory]);

  const transact = useCallback((recipe: (current: Timeline) => Timeline) => {
    setTimeline((current) => {
      snapshot(current);
      const next = recipe(cloneTimeline(current));
      if (!next.frames.length) return current;
      next.currentFrame = clampFrame(next.currentFrame, next.frames.length);
      return next;
    });
  }, [snapshot]);

  const replace = useCallback((frames: Pix[], currentFrame = 0, record = true) => {
    if (!frames.length) return;
    setTimeline((current) => {
      if (record) snapshot(current);
      return { frames: frames.map(clonePix), currentFrame: clampFrame(currentFrame, frames.length) };
    });
  }, [snapshot]);

  const commitFrame = useCallback((nextPix: Pix) => {
    transact((current) => {
      current.frames[current.currentFrame] = clonePix(nextPix);
      return current;
    });
  }, [transact]);

  const setCurrentFrame = useCallback((currentFrame: number) => {
    setTimeline((current) => ({ ...current, currentFrame: clampFrame(currentFrame, current.frames.length) }));
  }, []);

  const operate = useCallback((operation: FrameOperation) => {
    transact((current) => {
      const { frames, currentFrame } = current;
      const active = frames[currentFrame];
      switch (operation) {
        case "add":
          frames.splice(currentFrame + 1, 0, makePix(active.w, active.h));
          current.currentFrame = currentFrame + 1;
          break;
        case "duplicate":
          frames.splice(currentFrame + 1, 0, clonePix(active));
          current.currentFrame = currentFrame + 1;
          break;
        case "delete":
          if (frames.length > 1) {
            frames.splice(currentFrame, 1);
            current.currentFrame = Math.max(0, currentFrame - 1);
          }
          break;
        case "moveLeft":
          if (currentFrame > 0) {
            [frames[currentFrame - 1], frames[currentFrame]] = [frames[currentFrame], frames[currentFrame - 1]];
            current.currentFrame = currentFrame - 1;
          }
          break;
        case "moveRight":
          if (currentFrame < frames.length - 1) {
            [frames[currentFrame + 1], frames[currentFrame]] = [frames[currentFrame], frames[currentFrame + 1]];
            current.currentFrame = currentFrame + 1;
          }
          break;
        case "single":
          return { frames: [clonePix(active)], currentFrame: 0 };
        case "reverse":
          frames.reverse();
          current.currentFrame = frames.length - 1 - currentFrame;
          break;
        case "pingPong":
          if (frames.length > 1) current.frames = [...frames, ...frames.slice(1, -1).reverse().map(clonePix)];
          break;
      }
      return current;
    });
  }, [transact]);

  const undo = useCallback(() => {
    setTimeline((current) => {
      const previous = past.current.pop();
      if (!previous) return current;
      future.current.push(cloneTimeline(current));
      return cloneTimeline(previous);
    });
  }, []);

  const redo = useCallback(() => {
    setTimeline((current) => {
      const next = future.current.pop();
      if (!next) return current;
      past.current.push(cloneTimeline(current));
      return cloneTimeline(next);
    });
  }, []);

  const clearHistory = useCallback(() => {
    past.current = [];
    future.current = [];
  }, []);

  return {
    frames: timeline.frames,
    currentFrame: timeline.currentFrame,
    currentPix: timeline.frames[timeline.currentFrame],
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    commitFrame,
    replace,
    operate,
    setCurrentFrame,
    undo,
    redo,
    clearHistory,
  };
}
