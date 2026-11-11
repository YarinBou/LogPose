"use client";

import { useEffect, useSyncExternalStore, type RefObject } from "react";

/** Whether a CSS media query matches. False on the server and until hydration. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog keyboard behaviour for a panel that opens over other content:
 *  - focus moves into the panel when it opens, and back to where it was when it closes;
 *  - Tab and Shift+Tab cycle inside the panel instead of escaping behind it;
 *  - Escape closes it, wherever focus is.
 * `resetKey` re-runs the "focus moves in" step, for a panel that changes subject while open.
 */
export function useDialogFocus(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void, resetKey?: string): void {
  // Remember what had focus before the panel opened, and give it back afterwards.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // preventScroll: opening a panel must not make the page jump to it.
    ref.current?.focus({ preventScroll: true });
  }, [open, ref, resetKey]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      const panel = ref.current;
      if (event.key !== "Tab" || !panel || !panel.contains(document.activeElement)) return;

      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, ref]);
}
