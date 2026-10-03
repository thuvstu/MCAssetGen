"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  message: string;
  type: ToastKind;
}

export interface ToastController {
  toast: Toast | null;
  notify: (message: string, type?: ToastKind) => void;
  dismiss: () => void;
}

const VISIBLE_MS: Record<ToastKind, number> = {
  success: 3800,
  info: 3800,
  error: 6500,
};

/** Single-slot toast queue: a new message replaces the previous one. */
export function useToasts(): ToastController {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const notify = useCallback((message: string, type: ToastKind = "success") => {
    clearTimer();
    setToast({ message, type });
    timer.current = setTimeout(() => setToast(null), VISIBLE_MS[type]);
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setToast(null);
  }, []);

  useEffect(() => clearTimer, []);

  return { toast, notify, dismiss };
}
