"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  eyebrow?: string;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE =
  'button:not([disabled]), a[href], input, select, textarea, [tabindex="0"]';

/** Dialog with focus trapping, Escape handling and focus restoration. */
export default function Modal({
  title,
  eyebrow,
  wide = false,
  onClose,
  children,
}: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const atStart =
        document.activeElement === first ||
        document.activeElement === panel.current;
      if (event.shiftKey && atStart) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`modal-panel ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panel}
        tabIndex={-1}
      >
        <div className="modal-heading">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="閉じる">
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
