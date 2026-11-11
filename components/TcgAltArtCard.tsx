"use client";

import { useRef, type PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import {
  Anchor,
  BookOpen,
  Candy,
  Castle,
  Cat,
  Crown,
  Fish,
  Flame,
  FlaskConical,
  Gem,
  Ghost,
  Hammer,
  Heart,
  Mountain,
  PawPrint,
  Shield,
  Skull,
  Snowflake,
  Sparkles,
  Star,
  Swords,
  WavesHorizontal,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { BountyBadge } from "@/components/BountyBadge";
import type { CardGlyph, KeyCharacter, Rarity } from "@/data/timeline";
import { cn } from "@/lib/utils";

const GLYPHS: Record<CardGlyph, LucideIcon> = {
  hat: Sparkles,
  swords: Swords,
  skull: Skull,
  crown: Crown,
  flame: Flame,
  bolt: Zap,
  anchor: Anchor,
  fish: Fish,
  ghost: Ghost,
  snow: Snowflake,
  sand: Wind,
  flask: FlaskConical,
  heart: Heart,
  gem: Gem,
  shield: Shield,
  whale: WavesHorizontal,
  castle: Castle,
  candy: Candy,
  dragon: Mountain,
  paw: PawPrint,
  hammer: Hammer,
  cat: Cat,
  book: BookOpen,
  star: Star,
};

const RARITY_LABEL: Record<Rarity, string> = {
  L: "Leader",
  SEC: "Secret Rare",
  SR: "Super Rare",
  R: "Rare",
};

/** How far the card leans toward the pointer, in degrees. */
const MAX_TILT = 14;

interface TcgAltArtCardProps {
  character: KeyCharacter;
  /** Collector line at the foot of the card, such as "OP-ALA 05". */
  setCode: string;
  className?: string;
}

/**
 * A character card styled after a trading-card alternate art.
 * Hovering tilts it in 3D toward the pointer and slides a holographic foil and a glare
 * across the face. The foil reads the pointer position from CSS variables, so pointer
 * moves never re-render React.
 */
export function TcgAltArtCard({ character, setCode, className }: TcgAltArtCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const rotateX = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  const lift = useSpring(useMotionValue(1), { stiffness: 260, damping: 20 });

  const Glyph = GLYPHS[character.glyph];
  const [dark, light] = character.palette;

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;
    const box = card.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    const py = Math.min(1, Math.max(0, (event.clientY - box.top) / box.height));

    card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    card.style.setProperty("--foil", "1");

    if (!reduceMotion) {
      rotateY.set((px - 0.5) * 2 * MAX_TILT);
      rotateX.set((0.5 - py) * 2 * MAX_TILT);
      lift.set(1.045);
    }
  }

  function handlePointerLeave() {
    cardRef.current?.style.setProperty("--foil", "0");
    rotateX.set(0);
    rotateY.set(0);
    lift.set(1);
  }

  return (
    <div className={cn("w-52 shrink-0 [perspective:900px]", className)}>
      <motion.div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
        style={{ rotateX, rotateY, scale: lift }}
        className="tcg-card relative aspect-[63/88] w-full touch-pan-y select-none rounded-[14px] p-[7px] shadow-[0_16px_30px_-10px_rgba(0,0,0,0.75)] will-change-transform"
      >
        {/* gold frame */}
        <div
          className="absolute inset-0 rounded-[14px]"
          style={{ background: "linear-gradient(135deg, #fbeab0 0%, #b08424 28%, #f6dc8b 52%, #8a6418 76%, #ecc14f 100%)" }}
        />

        {/* face */}
        <div
          className="relative flex h-full flex-col overflow-hidden rounded-[9px] text-parchment-50"
          style={{ background: `linear-gradient(160deg, ${dark} 0%, ${dark} 38%, ${light} 130%)` }}
        >
          {/* header: rarity gem and name */}
          <div className="flex items-start gap-2 px-2.5 pt-2.5">
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold-300/80 font-display text-[11px] leading-none text-gold-200"
              style={{ background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.35), rgba(0,0,0,0.45))" }}
              title={RARITY_LABEL[character.rarity]}
            >
              {character.rarity}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[17px] leading-none text-shadow-deep">{character.name}</p>
              <p className="mt-0.5 truncate text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gold-200/90">
                {character.epithet}
              </p>
            </div>
          </div>

          {/* art window */}
          <div
            className="relative mx-2.5 mt-2 flex-1 overflow-hidden rounded-md border border-white/25"
            style={{ background: `radial-gradient(circle at 50% 42%, ${light} 0%, ${dark} 78%)` }}
          >
            <div className="halftone absolute inset-0 opacity-70" />
            {/* speed lines */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  "repeating-conic-gradient(from 0deg at 50% 46%, rgba(255,255,255,0.0) 0deg 7deg, rgba(255,255,255,0.22) 7deg 8deg)",
              }}
            />
            <Glyph
              className="absolute left-1/2 top-[46%] h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
              strokeWidth={1.4}
            />
            <span className="absolute bottom-1 right-1.5 rounded-sm bg-black/55 px-1 py-px text-[8px] font-bold uppercase tracking-[0.16em] text-gold-200">
              Alt Art
            </span>
          </div>

          {/* text box */}
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="truncate text-[9.5px] uppercase tracking-[0.12em] text-white/75">{character.affiliation}</p>
            <div className="mt-1 flex justify-center">
              <BountyBadge amount={character.bounty} size="sm" countUp />
            </div>
            {character.bountyNote ? (
              <p className="mt-1 line-clamp-2 text-center text-[9px] leading-tight text-white/80">{character.bountyNote}</p>
            ) : null}
            <p className="mt-1 flex items-center justify-between text-[8px] uppercase tracking-[0.14em] text-white/55">
              <span>{setCode}</span>
              <span>{RARITY_LABEL[character.rarity]}</span>
            </p>
          </div>

          {/* holographic layers */}
          <div className="tcg-foil pointer-events-none absolute inset-0" />
          <div className="tcg-glare pointer-events-none absolute inset-0" />
        </div>
      </motion.div>
    </div>
  );
}
