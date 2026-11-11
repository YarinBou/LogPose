"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useDragControls } from "framer-motion";
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

interface PanelBodyProps {
  subject: PanelSubject;
  headingId: string;
}

function PanelBody({ subject, headingId }: PanelBodyProps) {
  return subject.kind === "location" ? (
    <LocationDetails location={subject.location} headingId={headingId} />
  ) : (
    <PoneglyphDetails stone={subject.stone} headingId={headingId} />
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
 */
export function LocationPopover({ subject, anchor, frame, transition, onClose }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
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

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-30"
      style={{ transform: `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`, transition, width }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-labelledby={headingId}
        tabIndex={-1}
        className="parchment pointer-events-auto relative flex flex-col rounded-lg outline-none ring-1 ring-ink-900/30"
        style={{ maxHeight }}
      >
        {showArrow ? (
          <span
            aria-hidden="true"
            className={cn(
              "absolute h-3.5 w-3.5 rotate-45 border-ink-900/30 bg-parchment-100",
              onRight ? "-left-[7.5px] border-b border-l" : "-right-[7.5px] border-r border-t",
            )}
            style={{ top: arrowY - 7 }}
          />
        ) : null}
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-1 pt-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-ink-500">
            {subject.kind === "location" ? "Island log" : "Poneglyph"}
          </p>
          <CloseButton onClose={onClose} name={subjectName(subject)} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
          <PanelBody subject={subject} headingId={headingId} />
        </div>
      </div>
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
 * Slides up from the bottom of the screen and covers at most the lower 58% of it, so the
 * island stays visible above. Drag the handle down, or press Close or Escape, to dismiss.
 * It is portalled to <body> so that no ancestor can clip or re-anchor it.
 */
export function LocationSheet({ subject, onClose, visible }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const dragControls = useDragControls();

  useDialogFocus(panelRef, visible, onClose, subjectKey(subject));

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-labelledby={headingId}
      tabIndex={-1}
      drag="y"
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
        !visible && "pointer-events-none invisible",
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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        <PanelBody subject={subject} headingId={headingId} />
      </div>
    </motion.div>,
    document.body,
  );
}
