"use client";

import { motion } from "framer-motion";
import { PandamanSprite } from "@/components/art/Sprites";
import { usePandamanHunt } from "@/components/EasterEggs";
import { cn, seededUnit } from "@/lib/utils";

interface PandamanEasterEggProps {
  /** Id of the card he is hiding on. Also seeds where on the card he stands. */
  id: string;
  className?: string;
}

/**
 * A small, nearly transparent Pandaman tucked into the background of a timeline card.
 * His spot is "random" but derived from the card id, so the server and the browser agree on it.
 * Clicking him counts toward the hunt tally in the footer.
 */
export function PandamanEasterEgg({ id, className }: PandamanEasterEggProps) {
  const { found, total, spot } = usePandamanHunt();
  const isFound = found.has(id);

  // Keep him in the lower band of the card, away from the text.
  const left = 8 + seededUnit(id, 1) * 72;
  const bottom = 2 + seededUnit(id, 2) * 8;
  const tilt = -10 + seededUnit(id, 3) * 20;

  return (
    <motion.button
      type="button"
      onClick={() => spot(id)}
      aria-label={isFound ? "Pandaman, found" : "Something is hiding here"}
      title={isFound ? `Pandaman found! (${found.size}/${total})` : undefined}
      className={cn("absolute z-[1] w-7 cursor-pointer select-none sm:w-8", className)}
      style={{ left: `${left}%`, bottom: `${bottom}%`, rotate: tilt }}
      initial={false}
      animate={isFound ? { opacity: 1, scale: [1, 1.5, 1.15], y: [0, -10, 0] } : { opacity: 0.13, scale: 1, y: 0 }}
      whileHover={isFound ? undefined : { opacity: 0.45 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <PandamanSprite className="h-auto w-full drop-shadow-sm" />
    </motion.button>
  );
}
