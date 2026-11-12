"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { LocationDetails, PoneglyphDetails } from "@/components/map/LocationDetails";
import type { MapLocation, Poneglyph } from "@/data/map";
import { useDialogFocus } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/** What the panel is showing. */
export type PanelSubject = { kind: "location"; location: MapLocation } | { kind: "poneglyph"; stone: Poneglyph };

export function subjectKey(subject: PanelSubject): string {
  return subject.kind === "location" ? `location:${subject.location.id}` : `poneglyph:${subject.stone.id}`;
}

function subjectName(subject: PanelSubject): string {
  return subject.kind === "location" ? subject.location.name : subject.stone.name;
}

/** The panel's entrance and exit: a spring, or a short fade when less motion is asked for. */
const SPRING = { type: "spring", stiffness: 420, damping: 32, mass: 0.9 } as const;
const FADE = { duration: 0.15 } as const;

/**
 * The panel's content. When the subject changes while the panel is open, the old content
 * fades out as the new fades in, inside the same panel: the panel itself stays mounted.
 */
function PanelBody({ subject, headingId }: { subject: PanelSubject; headingId: string }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={subjectKey(subject)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {subject.kind === "location" ? (
          <LocationDetails location={subject.location} headingId={headingId} />
        ) : (
          <PoneglyphDetails stone={subject.stone} headingId={headingId} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function CloseButton({ onClose, name }: { onClose: () => void; name: string }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={`Close details for ${name}`}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink-500/40 text-ink-700 hover:bg-ink-900 hover:text-parchment-100"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop: a popover anchored to the island                            */
/* ------------------------------------------------------------------ */

/** Gap between the island and the edge of the popover, in pixels. */
const ANCHOR_GAP = 26;
const EDGE = 10;

interface PopoverProps {
  subject: PanelSubject;
  /** Where the island is inside the map frame, in pixels. */
  anchor: { x: number; y: number };
  frame: { width: number; height: number };
  /** CSS transition to move with, so the popover tracks the island while the map glides. */
  transition: string;
  onClose: () => void;
}

/**
 * Sits beside the selected island, inside the map frame, with an arrow pointing at it.
 * It goes to the right of the island when there is room and to the left when there is not,
 * and it is repositioned on every pan and zoom so the arrow keeps pointing at the island.
 *
 * Two elements share the work: the outer one is moved into place with the same CSS
 * transition as the map, so it travels with the island; the inner one springs open from
 * the island's side (scale and fade), and closes the same way in reverse.
 */
export function LocationPopover({ subject, anchor, frame, transition, onClose }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const reduceMotion = useReducedMotion();
  const [height, setHeight] = useState(0);

  useDialogFocus(panelRef, true, onClose, subjectKey(subject));

  // The popover is centred on the island vertically, so its own height has to be known.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const measure = () => setHeight(panel.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  const width = Math.min(416, Math.max(280, frame.width * 0.46));
  const maxHeight = frame.height - EDGE * 2;

  const fitsRight = anchor.x + ANCHOR_GAP + width <= frame.width - EDGE;
  const fitsLeft = anchor.x - ANCHOR_GAP - width >= EDGE;
  const onRight = fitsRight || !fitsLeft;

  const rawLeft = onRight ? anchor.x + ANCHOR_GAP : anchor.x - ANCHOR_GAP - width;
  const left = Math.min(frame.width - width - EDGE, Math.max(EDGE, rawLeft));
  const top = Math.min(frame.height - height - EDGE, Math.max(EDGE, anchor.y - height / 2));

  // The arrow follows the island up and down the edge, and disappears once the island has
  // been panned out of the frame or under the popover itself.
  const arrowY = anchor.y - top;
  const islandVisible = anchor.x >= 0 && anchor.x <= frame.width && anchor.y >= 0 && anchor.y <= frame.height;
  const islandClear = onRight ? anchor.x < left : anchor.x > left + width;
  const showArrow = islandVisible && islandClear && arrowY >= 18 && arrowY <= height - 18;

  // Open from the point nearest the island, so the popover seems to grow out of it.
  const originY = height > 0 ? Math.min(1, Math.max(0, arrowY / height)) : 0.5;

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-30"
      style={{ transform: `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`, transition, width }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-labelledby={headingId}
        tabIndex={-1}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.82 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.88 }}
        transition={reduceMotion ? FADE : SPRING}
        className="parchment pointer-events-auto relative flex flex-col rounded-lg outline-none ring-1 ring-ink-900/30"
        style={{ maxHeight, originX: onRight ? 0 : 1, originY }}
      >
        {showArrow ? (
          <span
            aria-hidden="true"
            className={cn(
              "absolute h-3.5 w-3.5 border-ink-900/30 bg-parchment-100",
              onRight ? "-left-[7.5px] border-b border-l" : "-right-[7.5px] border-r border-t",
            )}
            // Follows the island with the same timing as the map, so it never lags behind.
            style={{ top: 0, transform: `translateY(${(arrowY - 7).toFixed(1)}px) rotate(45deg)`, transition }}
          />
        ) : null}
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-1 pt-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-ink-500">
            {subject.kind === "location" ? "Island log" : "Poneglyph"}
          </p>
          <CloseButton onClose={onClose} name={subjectName(subject)} />
        </div>
        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
          <PanelBody subject={subject} headingId={headingId} />
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile: a bottom sheet                                               */
/* ------------------------------------------------------------------ */

interface SheetProps {
  subject: PanelSubject;
  onClose: () => void;
  /** False while the map is scrolled out of view: the sheet steps aside until it returns. */
  visible: boolean;
}

/**
 * Slides up from the bottom of the screen on a spring and covers at most the lower 58% of
 * it, so the island stays visible above. Drag the handle down, or press Close or Escape,
 * to send it back down. It is portalled to <body> so that no ancestor can clip or
 * re-anchor it.
 */
export function LocationSheet({ subject, onClose, visible }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const dragControls = useDragControls();
  const reduceMotion = useReducedMotion();

  useDialogFocus(panelRef, visible, onClose, subjectKey(subject));

  if (typeof document === "undefined") return null;

  const hidden = reduceMotion ? { opacity: 0 } : { y: "100%" };
  const shown = reduceMotion ? { opacity: 1 } : { y: 0 };

  return createPortal(
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-labelledby={headingId}
      tabIndex={-1}
      initial={hidden}
      animate={visible ? shown : hidden}
      exit={hidden}
      transition={reduceMotion ? FADE : SPRING}
      drag={reduceMotion ? false : "y"}
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.7 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 90 || info.velocity.y > 600) onClose();
      }}
      className={cn(
        "parchment fixed inset-x-0 bottom-0 z-[60] flex max-h-[58svh] flex-col rounded-t-2xl outline-none ring-1 ring-ink-900/30",
        "pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_32px_-8px_rgba(0,0,0,0.7)]",
        !visible && "pointer-events-none",
      )}
    >
      {/* handle: the only part that starts a drag, so the content below can scroll */}
      <div
        onPointerDown={(event) => dragControls.start(event)}
        className="flex shrink-0 cursor-grab touch-none items-center justify-between gap-3 px-4 pb-1 pt-2.5 active:cursor-grabbing"
      >
        <span className="w-8" />
        <span className="h-1.5 w-12 rounded-full bg-ink-500/50" aria-hidden="true" />
        <CloseButton onClose={onClose} name={subjectName(subject)} />
      </div>
      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        <PanelBody subject={subject} headingId={headingId} />
      </div>
    </motion.div>,
    document.body,
  );
}
