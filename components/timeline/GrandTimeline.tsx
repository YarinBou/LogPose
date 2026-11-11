"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/SectionHeading";
import { ArcNode } from "@/components/timeline/ArcNode";
import { SunnyTracker } from "@/components/timeline/SunnyTracker";
import { SAGAS, type Saga } from "@/data/timeline";
import { cn } from "@/lib/utils";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** "four-emperors" -> "OP-FOU": the set code printed on that saga's character cards. */
function sagaCode(saga: Saga): string {
  return `OP-${saga.id.replace(/[^a-z0-9]/g, "").slice(0, 3).toUpperCase()}`;
}

function SagaBanner({ saga, index }: { saga: Saga; index: number }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative z-10 ml-14 lg:mx-auto lg:max-w-2xl"
    >
      <div className="wood gold-trim relative overflow-hidden rounded-md px-5 py-5 text-center sm:px-8">
        <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: saga.accent }} />
        {/* nail heads */}
        {["left-2.5 top-4", "right-2.5 top-4", "left-2.5 bottom-2.5", "right-2.5 bottom-2.5"].map((position) => (
          <span key={position} className={cn("absolute h-2 w-2 rounded-full bg-gold-500 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.6)]", position)} />
        ))}
        <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-gold-300/90">
          Saga {ROMAN[index]} · OP year {saga.years} · {saga.arcs.length} {saga.arcs.length === 1 ? "arc" : "arcs"}
        </p>
        <h3 className="gold-text mt-1 font-display text-4xl leading-none sm:text-5xl">{saga.name}</h3>
        <p className="mt-2 text-sm italic leading-snug text-parchment-100/90">{saga.tagline}</p>
      </div>
    </motion.header>
  );
}

/** The end of the line. "Waraibanashi" (a funny story) fades into the parchment. */
function LaughTale() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9 }}
      className="relative z-10 ml-14 lg:mx-auto lg:max-w-2xl"
    >
      <div className="parchment relative overflow-hidden rounded-lg px-6 pb-24 pt-8 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-ink-500">The last island</p>
        <h3 className="mt-1 font-display text-5xl leading-none text-ink-900">Laugh Tale</h3>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-700">
          It is on no chart. Four red stones, read together, give its position. Roger&apos;s crew reached it in 1499,
          found what Joy Boy left behind, and laughed. The rest of this page is not written yet.
        </p>
        <p
          lang="ja-Latn"
          title="Waraibanashi: a funny story"
          className="pointer-events-none absolute inset-x-0 bottom-3 select-none whitespace-nowrap font-display text-6xl italic tracking-[0.12em] text-ink-900/[0.11] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.35)_55%,transparent_100%)] sm:text-7xl"
        >
          Waraibanashi
        </p>
      </div>
    </motion.div>
  );
}

export function GrandTimeline() {
  const trackRef = useRef<HTMLDivElement>(null);

  // Number the arcs across the whole journey so cards keep alternating sides between sagas.
  let arcNumber = 0;

  return (
    <section id="timeline" className="relative z-10 scroll-mt-14 px-3 pb-28 pt-24 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeading kicker="Chronicle" title="The Grand Timeline">
          Every arc in sailing order, dated on the Sea Circle Calendar as the Library of Ohara reconstructs it. Follow the
          Sunny down the page.
        </SectionHeading>

        <nav aria-label="Sagas" className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2">
          {SAGAS.map((saga) => (
            <a
              key={saga.id}
              href={`#saga-${saga.id}`}
              className="rounded-full border border-gold-500/50 bg-ocean-950/60 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-parchment-100 backdrop-blur-sm transition-colors hover:border-gold-300 hover:text-gold-300"
            >
              {saga.name.replace(" Saga", "")}
            </a>
          ))}
        </nav>

        <div ref={trackRef} className="relative mt-16 pb-24">
          <SunnyTracker trackRef={trackRef} />

          <div className="space-y-24">
            {SAGAS.map((saga, sagaIndex) => (
              <section
                key={saga.id}
                id={`saga-${saga.id}`}
                aria-label={saga.name}
                className={cn("relative scroll-mt-20", saga.alabastaCursor && "cursor-alabasta-x")}
              >
                <SagaBanner saga={saga} index={sagaIndex} />
                <ol className="mt-10 space-y-10 lg:space-y-6">
                  {saga.arcs.map((arc, arcIndex) => {
                    arcNumber += 1;
                    return (
                      <ArcNode
                        key={arc.id}
                        arc={arc}
                        number={arcNumber}
                        side={arcNumber % 2 === 1 ? "left" : "right"}
                        setCode={`${sagaCode(saga)} ${String(arcIndex + 1).padStart(2, "0")}`}
                      />
                    );
                  })}
                </ol>
              </section>
            ))}

            <LaughTale />
          </div>
        </div>
      </div>
    </section>
  );
}
