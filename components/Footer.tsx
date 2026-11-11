"use client";

import { DoskoiPandaMark, PandamanSprite } from "@/components/art/Sprites";
import { usePandamanHunt } from "@/components/EasterEggs";
import { cn } from "@/lib/utils";

const SOURCES = [
  { label: "The One Piece Timeline", href: "https://thelibraryofohara.com/the-one-piece-timeline/" },
  { label: "One Piece World Map", href: "https://thelibraryofohara.com/onepieceworldmap/" },
];

/** Deck planks at the bottom of the page: brand badges, the Pandaman tally, and the sources. */
export function Footer() {
  const { found, total } = usePandamanHunt();
  const complete = found.size === total;

  return (
    <footer className="wood relative z-10 border-t-4 border-gold-600 text-parchment-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.3fr]">
        {/* brands */}
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-3" title="Doskoi Panda: the brand you see on half the wardrobes in the Grand Line">
            <DoskoiPandaMark className="h-14 w-14 drop-shadow-md" />
            <p className="font-display text-xl leading-none">
              DOSKOI
              <br />
              PANDA
            </p>
          </div>
          <div
            className="-rotate-3 rounded-sm border-2 border-parchment-100 bg-ink-900 px-3 py-1.5 shadow-md"
            title="Criminal: Fish-Man Island's finest label"
          >
            <p className="text-lg font-black italic leading-none tracking-tight text-parchment-50">CRIMINAL</p>
            <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-gold-300">Fish-Man Island</p>
          </div>
        </div>

        {/* Pandaman hunt */}
        <div className="flex items-center gap-3">
          <PandamanSprite className={cn("h-14 w-auto transition-opacity duration-500", complete ? "opacity-100" : "opacity-50")} />
          <div>
            <p className="font-display text-2xl leading-none text-gold-300">Pandaman hunt</p>
            <p className="mt-1 text-sm" aria-live="polite">
              {complete
                ? `All ${total} found. He was there the whole time.`
                : `${found.size} of ${total} found. He is hiding on the timeline.`}
            </p>
          </div>
        </div>

        {/* sources */}
        <div className="text-sm leading-relaxed">
          <p className="font-display text-2xl leading-none text-gold-300">Sources</p>
          <p className="mt-1">
            Dates and place names follow the Library of Ohara:{" "}
            {SOURCES.map((source, index) => (
              <span key={source.href}>
                <a href={source.href} target="_blank" rel="noreferrer" className="font-semibold text-gold-200 underline underline-offset-2 hover:text-gold-300">
                  {source.label}
                </a>
                {index < SOURCES.length - 1 ? " and " : "."}
              </span>
            ))}
          </p>
        </div>
      </div>

      <p className="border-t border-black/40 px-5 py-4 text-center text-xs text-parchment-100/70">
        LogPose is an unofficial fan project. One Piece is created by Eiichiro Oda and published by Shueisha. No official
        artwork is used here.
      </p>
    </footer>
  );
}
