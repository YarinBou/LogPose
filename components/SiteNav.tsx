"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { LogPoseMark } from "@/components/art/Sprites";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#timeline", label: "Timeline", short: "Timeline" },
  { href: "/#crew", label: "Crew", short: "Crew" },
  { href: "/#map", label: "World Map", short: "Map" },
  { href: "/3d-world-map", label: "3D World Map", short: "3D" },
];

interface SiteNavProps {
  /** Always show the planked bar. Used on pages with no hero to sit over. */
  solid?: boolean;
}

/** Top bar: clear over the hero, planked once the page has scrolled. */
export function SiteNav({ solid = false }: SiteNavProps) {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 80);
  });

  const docked = solid || scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300",
        docked ? "wood shadow-[0_6px_18px_rgba(0,0,0,0.55)]" : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-6" aria-label="Main">
        <Link href="/#top" className="flex items-center gap-2 font-display text-2xl text-gold-200" aria-label="LogPose home">
          <LogPoseMark spinning className="h-8 w-8" />
          <span className="hidden min-[430px]:inline">LogPose</span>
        </Link>
        <ul className="flex items-center gap-0.5 sm:gap-2">
          {LINKS.map((link) => {
            const current = link.href === pathname;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-label={link.label}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-full px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-black/25 hover:text-gold-300 sm:px-3.5 sm:text-[13px] sm:tracking-[0.14em]",
                    current ? "bg-black/30 text-gold-300" : "text-parchment-100",
                  )}
                >
                  <span className="sm:hidden">{link.short}</span>
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
