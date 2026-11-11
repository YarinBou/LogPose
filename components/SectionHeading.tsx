import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  kicker: string;
  title: string;
  children?: ReactNode;
  className?: string;
}

/** Shared heading block: small gold kicker, big display title, optional intro line. */
export function SectionHeading({ kicker, title, children, className }: SectionHeadingProps) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold-300">{kicker}</p>
      <h2 className="gold-text mt-2 font-display text-5xl leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)] sm:text-6xl">
        {title}
      </h2>
      {children ? <p className="text-shadow-deep mt-4 text-base leading-relaxed text-parchment-100">{children}</p> : null}
    </div>
  );
}
