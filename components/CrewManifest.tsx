"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BountyBadge } from "@/components/BountyBadge";
import { SectionHeading } from "@/components/SectionHeading";
import { ALL_ARCS, CREW, type CrewId } from "@/data/timeline";

const ORDER: CrewId[] = ["luffy", "zoro", "nami", "usopp", "sanji", "chopper", "robin", "franky", "brook", "jinbe"];

/** The arc in which each member came aboard, read straight from the timeline data. */
const JOINED = new Map(
  ORDER.map((id) => [id, ALL_ARCS.find((arc) => arc.crewJoined.includes(id))] as const),
);

/** The crew as a wall of wanted posters, in the order they joined, with current bounties. */
export function CrewManifest() {
  return (
    <section id="crew" className="relative z-10 scroll-mt-14 px-3 pb-24 pt-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeading kicker="Muster roll" title="The Crew">
          Ten pirates, in the order they came aboard. Bounties are the latest issued, after the raid on Onigashima. Each
          poster opens that pirate&apos;s{" "}
          <Link href="/crew" className="font-semibold text-gold-300 underline underline-offset-2">
            bounty history
          </Link>
          .
        </SectionHeading>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {ORDER.map((id, index) => {
            const member = CREW[id];
            const arc = JOINED.get(id);
            return (
              <motion.li
                key={id}
                initial={{ opacity: 0, y: 30, rotate: index % 2 === 0 ? -2 : 2 }}
                whileInView={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? -0.6 : 0.6 }}
                whileHover={{ rotate: 0, y: -4 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{ duration: 0.5, delay: (index % 5) * 0.05 }}
                className="parchment flex flex-col items-center rounded-md px-3 pb-3 pt-2.5 text-center"
              >
                <p className="font-display text-2xl leading-none tracking-[0.2em] text-ink-900">WANTED</p>
                <div
                  className="mt-2 grid aspect-[5/4] w-full place-items-center rounded-sm border border-ink-700/40 bg-gradient-to-br from-ink-700 to-ink-900"
                  aria-hidden="true"
                >
                  <span className="gold-text font-display text-6xl leading-none">{member.name.replace("Monkey D. ", "").charAt(0)}</span>
                </div>
                <h3 className="mt-2 font-display text-[22px] leading-none text-ink-900">
                  <Link href={`/crew/${id}`} className="hover:text-redline-600">
                    {member.name}
                  </Link>
                </h3>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-redline-600">
                  {member.role} · &ldquo;{member.epithet}&rdquo;
                </p>
                <BountyBadge amount={member.bounty} size="sm" countUp className="mt-2" />
                <p className="mt-2 text-[11.5px] leading-snug text-ink-700">
                  Born {member.born}
                  {arc ? (
                    <>
                      <br />
                      Joined at{" "}
                      <a href={`#arc-${arc.id}`} className="font-semibold text-ocean-700 underline decoration-ocean-700/40 underline-offset-2">
                        {arc.name}
                      </a>
                    </>
                  ) : null}
                </p>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
