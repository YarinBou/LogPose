import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { FAQ } from "@/lib/faq";

/**
 * Common questions with direct answers, written out in full on the page. The same
 * entries are published as FAQPage structured data by the home page.
 */
export function Faq() {
  return (
    <section id="faq" className="relative z-10 scroll-mt-14 px-3 pb-28 pt-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <SectionHeading kicker="Ship's log" title="Questions, Answered">
          Short answers to what people ask most about the One Piece timeline and world, taken straight from the data on this
          site.
        </SectionHeading>

        <div className="parchment mt-10 rounded-lg px-5 py-6 sm:px-9 sm:py-8">
          <dl className="grid gap-x-10 gap-y-7 md:grid-cols-2">
            {FAQ.map((entry) => (
              <div key={entry.question}>
                <dt className="font-display text-2xl leading-tight text-ink-900">{entry.question}</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-ink-700">{entry.answer}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 border-t border-ink-500/30 pt-4 text-[14px] text-ink-700">
            Reference pages:{" "}
            <Link href="/arcs" className="font-semibold text-ocean-700 underline underline-offset-2">
              all arcs in order
            </Link>
            ,{" "}
            <Link href="/crew" className="font-semibold text-ocean-700 underline underline-offset-2">
              the crew and their bounties
            </Link>
            , and{" "}
            <Link href="/locations" className="font-semibold text-ocean-700 underline underline-offset-2">
              every charted location
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
