"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, CalendarDays, Globe, MapPin, UserPlus, Users } from "lucide-react";
import { StrawHatDachshund } from "@/components/art/Sprites";
import { BountyBadge } from "@/components/BountyBadge";
import { PandamanEasterEgg } from "@/components/PandamanEasterEgg";
import { TcgAltArtCard } from "@/components/TcgAltArtCard";
import { UsoppLieChip } from "@/components/timeline/UsoppLieChip";
import { CREW, type Arc } from "@/data/timeline";
import { focusLocationOnMap } from "@/lib/events";
import { cn } from "@/lib/utils";

interface ArcNodeProps {
  arc: Arc;
  /** Position of the arc in the whole journey, starting at 1. */
  number: number;
  /** Which side of the spine the card sits on at desktop widths. */
  side: "left" | "right";
  /** Collector code printed on the character card. */
  setCode: string;
}

/** One stop on the timeline: a parchment card pinned to the spine. */
export function ArcNode({ arc, number, side, setCode }: ArcNodeProps) {
  const reduceMotion = useReducedMotion();
  const offset = reduceMotion ? 0 : side === "left" ? -48 : 48;

  return (
    <li
      id={`arc-${arc.id}`}
      className={cn("relative flex scroll-mt-24 pl-14 lg:pl-0", side === "left" ? "lg:justify-start" : "lg:justify-end")}
    >
      {/* pin on the spine, and the rope from the pin to the card */}
      <span className="absolute left-6 top-9 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-gold-200 bg-redline-500 shadow-[0_0_0_4px_rgba(3,21,35,0.75)] lg:left-1/2" />
      <span
        className={cn(
          "absolute top-[2.6rem] hidden h-0 w-[3.2rem] border-t-2 border-dashed border-gold-400/60 lg:block",
          side === "left" ? "right-1/2 mr-2" : "left-1/2 ml-2",
        )}
      />

      <motion.article
        initial={{ opacity: 0, x: offset, y: reduceMotion ? 0 : 24 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -12% 0px" }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        className="parchment relative w-full rounded-lg p-4 sm:p-5 lg:w-[calc(50%-3.75rem)]"
      >
        {arc.pandaman ? <PandamanEasterEgg id={arc.id} /> : null}

        {arc.dachshund ? (
          <span
            className="absolute bottom-1.5 right-2 z-[1] block w-8 opacity-40 transition-opacity duration-500 hover:opacity-100"
            title="A very small Romance Dawn tribute"
          >
            <StrawHatDachshund className="h-auto w-full" />
          </span>
        ) : null}

        <div className="relative z-[2] flex flex-col items-center gap-5 sm:flex-row sm:items-start lg:flex-col lg:items-center xl:flex-row xl:items-start">
          <div className="min-w-0 flex-1 self-stretch">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              <span className="rounded-sm bg-ink-900 px-1.5 py-0.5 text-parchment-100">Log {String(number).padStart(2, "0")}</span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                OP year {arc.opYear}
              </span>
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {arc.chapters}
              </span>
            </p>

            <h4 className="mt-1.5 font-display text-4xl leading-none text-ink-900">{arc.name}</h4>
            <p className="mt-1 text-sm font-semibold text-redline-600">{arc.dateLabel}</p>

            <button
              type="button"
              onClick={() => focusLocationOnMap(arc.locationIds[0])}
              className="mt-1.5 inline-flex items-start gap-1 text-left text-[13px] font-medium text-ocean-700 underline decoration-ocean-700/40 underline-offset-2 hover:text-ocean-600 hover:decoration-ocean-600"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {arc.place}
            </button>

            <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{arc.summary}</p>
            <p className="mt-1.5">
              <Link
                href={`/arcs/${arc.id}`}
                className="text-[13px] font-semibold text-ocean-700 underline decoration-ocean-700/40 underline-offset-2 hover:text-ocean-600"
              >
                {arc.name} arc: full log entry
              </Link>
            </p>

            {arc.inspiration ? (
              <p className="mt-3 flex items-start gap-2 border-l-2 border-gold-600/60 pl-2.5 text-[13px] leading-snug text-ink-700">
                <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-700" />
                <span>
                  <span className="font-semibold text-ink-900">Real-world echo: </span>
                  {arc.inspiration}
                </span>
              </p>
            ) : null}

            {arc.crewJoined.length > 0 ? (
              <div className="mt-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                  <UserPlus className="h-3.5 w-3.5" />
                  Joined the crew
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {arc.crewJoined.map((id) => (
                    <li
                      key={id}
                      className="rounded-full border border-redline-700/40 bg-redline-500/10 px-2.5 py-0.5 text-[12.5px] text-ink-900"
                    >
                      <span className="font-semibold">{CREW[id].name}</span>
                      <span className="text-ink-500"> · {CREW[id].role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {arc.guests ? (
              <p className="mt-2 flex items-start gap-1.5 text-[12.5px] text-ink-700">
                <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
                <span>
                  <span className="font-semibold text-ink-900">Sailing along: </span>
                  {arc.guests.join(", ")}
                </span>
              </p>
            ) : null}

            {arc.bountyUpdates ? (
              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">New bounties</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {arc.bountyUpdates.map((update) => (
                    <li key={update.crew}>
                      <BountyBadge
                        amount={update.amount}
                        size="sm"
                        heading={CREW[update.crew].name.split(" ").slice(-1)[0]}
                        label={update.note}
                        countUp
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {arc.usoppLies ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {arc.usoppLies.map((lie) => (
                  <UsoppLieChip key={lie.lie} lie={lie} />
                ))}
              </div>
            ) : null}
          </div>

          <TcgAltArtCard character={arc.keyCharacter} setCode={setCode} />
        </div>
      </motion.article>
    </li>
  );
}
