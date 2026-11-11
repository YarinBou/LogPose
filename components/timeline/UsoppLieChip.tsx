"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Hourglass } from "lucide-react";
import type { UsoppLie } from "@/data/timeline";
import { cn } from "@/lib/utils";

/**
 * Usopp's Lies Tracker: a chip that says whether one of his tall tales has come true,
 * with the tale and the payoff in a tooltip. Opens on hover, focus or tap.
 */
export function UsoppLieChip({ lie }: { lie: UsoppLie }) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]",
          lie.fulfilled
            ? "border-emerald-800/50 bg-emerald-700/15 text-emerald-900"
            : "border-ink-500/50 bg-ink-500/10 text-ink-700",
        )}
      >
        {lie.fulfilled ? <Check className="h-3.5 w-3.5" /> : <Hourglass className="h-3.5 w-3.5" />}
        Usopp&apos;s lie: {lie.fulfilled ? "fulfilled" : "still open"}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.span
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="wood gold-trim absolute bottom-full left-0 z-30 mb-3 block w-64 rounded-md p-3 text-left text-xs leading-relaxed text-parchment-50"
          >
            <span className="block font-display text-base leading-tight text-gold-300">The lie</span>
            <span className="block italic">{lie.lie}</span>
            <span className="mt-2 block font-display text-base leading-tight text-gold-300">
              {lie.fulfilled ? "How it came true" : "Where it stands"}
            </span>
            <span className="block">{lie.note}</span>
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
