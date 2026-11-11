"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { cn, formatBerries } from "@/lib/utils";

interface BountyBadgeProps {
  /** Bounty in Berries. `null` renders the "no bounty" state. */
  amount: number | null;
  /** Small line under the amount: who it belongs to, or a qualifier. */
  label?: string;
  /** Line above the amount. Defaults to the poster's "Dead or Alive". */
  heading?: string;
  size?: "sm" | "md";
  /** Count up from zero the first time the badge scrolls into view. */
  countUp?: boolean;
  className?: string;
}

/** The Berry sign: a capital B struck through, drawn so it never depends on a font having the glyph. */
function BerrySign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 28" aria-hidden="true" className={className}>
      <path
        d="M4 4h7.2a5 5 0 0 1 2.3 9.5A5.4 5.4 0 0 1 11.8 24H4zM8 8v4.4h3a2.2 2.2 0 0 0 0-4.4zm0 8v4h3.6a2 2 0 0 0 0-4z"
        fill="currentColor"
        fillRule="evenodd"
      />
      <rect x="8.6" y="0.5" width="2.4" height="27" rx="1.2" fill="currentColor" />
    </svg>
  );
}

/**
 * Counts from zero to `target` once `active` turns true.
 * `requested` fixes the first render (zero) so server and browser agree; `animate` can then
 * veto the animation on the client (reduced motion) and jump straight to the target.
 */
function useCountUp(target: number, requested: boolean, animate: boolean, active: boolean): number {
  const [value, setValue] = useState(requested ? 0 : target);

  useEffect(() => {
    if (!requested || !animate) {
      setValue(target);
      return;
    }
    if (!active) return;

    let frame = 0;
    const duration = 1100;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, requested, animate, active]);

  return value;
}

/** A wanted-poster strip showing a bounty in Berries. */
export function BountyBadge({ amount, label, heading = "Dead or Alive", size = "md", countUp = false, className }: BountyBadgeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduceMotion = useReducedMotion();
  const requested = countUp && amount !== null;
  const shown = useCountUp(amount ?? 0, requested, !reduceMotion, inView);

  const small = size === "sm";

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex flex-col items-center rounded-[3px] border border-ink-700/50 bg-parchment-200 text-ink-900",
        "shadow-[inset_0_0_10px_rgba(112,66,20,0.35)]",
        small ? "px-2 py-1" : "px-3 py-1.5",
        className,
      )}
    >
      <span className={cn("font-display uppercase leading-none tracking-[0.18em] text-ink-500", small ? "text-[9px]" : "text-[10px]")}>
        {amount === null ? "Bounty" : heading}
      </span>
      {amount === null ? (
        <span className={cn("font-display leading-tight", small ? "text-sm" : "text-lg")}>None</span>
      ) : (
        <span
          className={cn("flex items-center gap-1 font-display leading-tight tabular-nums", small ? "text-sm" : "text-xl")}
          aria-label={`${formatBerries(amount)} Berries`}
        >
          <BerrySign className={small ? "h-3 w-auto" : "h-4 w-auto"} />
          <span aria-hidden="true">{formatBerries(shown)}</span>
          <span aria-hidden="true">-</span>
        </span>
      )}
      {label ? (
        <span className={cn("max-w-[15rem] text-center font-sans leading-tight text-ink-700", small ? "text-[10px]" : "text-[11px]")}>
          {label}
        </span>
      ) : null}
    </div>
  );
}
