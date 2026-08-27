"use client";

import { useEffect } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Anchored content rendered below the scrollable body (e.g. submit button). */
  footer?: React.ReactNode;
}

/**
 * Full-screen modal window that overlays the page.
 * Locks body scroll while open and closes on Escape or backdrop click.
 */
export function Modal({ title, onClose, children, footer }: ModalProps) {
  // Lock body scroll while the modal is open so only the window scrolls
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Window */}
      <div className="relative w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-tac-surface border border-tac-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-tac-border shrink-0">
          <h3 className="text-[11px] uppercase tracking-[0.25em] text-tac-muted font-mono">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="btn-tactical-ghost text-[10px] px-2 py-1"
            aria-label="Close"
          >
            [ CLOSE ]
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {/* Anchored footer */}
        {footer && (
          <div className="px-5 py-3 border-t border-tac-border shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
