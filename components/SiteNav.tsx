"use client";

import { useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { LogPoseMark } from "@/components/art/Sprites";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#timeline", label: "Timeline", short: "Timeline" },
  { href: "#crew", label: "Crew", short: "Crew" },
  { href: "#map", label: "World Map", short: "Map" },
];

/** Top bar: clear over the hero, planked once the page has scrolled. */
export function SiteNav() {
  const { scrollY } = useScroll();
  const [docked, setDocked] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    setDocked(y > 80);
  });

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300",
        docked ? "wood shadow-[0_6px_18px_rgba(0,0,0,0.55)]" : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main">
        <a href="#top" className="flex items-center gap-2 font-display text-2xl text-gold-200">
          <LogPoseMark spinning className="h-8 w-8" />
          LogPose
        </a>
        <ul className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                aria-label={link.label}
                className="whitespace-nowrap rounded-full px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-parchment-100 transition-colors hover:bg-black/25 hover:text-gold-300 sm:px-3.5 sm:text-[13px] sm:tracking-[0.14em]"
              >
                <span className="sm:hidden">{link.short}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
