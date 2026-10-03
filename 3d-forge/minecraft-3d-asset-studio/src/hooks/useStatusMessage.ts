"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useStatusMessage(initialMessage: string = "Ready") {
  const [message, setMessage] = useState(initialMessage);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showStatus = useCallback((nextMessage: string, duration = 3500) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(nextMessage);
    timeoutRef.current = setTimeout(() => {
      setMessage("Ready");
      timeoutRef.current = null;
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { message, showStatus };
}
