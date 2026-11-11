import type { Metadata } from "next";
import { ContentShell, Section, SourceNote, TextLink } from "@/components/content/ContentShell";
import { ALL_ARCS, CREW, SAGAS } from "@/data/timeline";
import { arcNumber, listOf, paths } from "@/lib/content";
import { collectionSchema, pageMetadata } from "@/lib/seo";

const TITLE = "All One Piece Arcs in Order";
const DESCRIPTION = `Every One Piece arc in order: ${ALL_ARCS.length} arcs across ${SAGAS.length} sagas, from Romance Dawn to Elbaf, each with its in-world date, manga chapters, location and the crew members who joined.`;

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: paths.arcs, type: "website" });

export default function ArcsPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Arcs", path: paths.arcs },
  ];

  return (
    <ContentShell
      crumbs={crumbs}
      kicker={`${ALL_ARCS.length} arcs · ${SAGAS.length} sagas`}
      title={TITLE}
      lead={
        <>
          The voyage of the Straw Hat Pirates, arc by arc, in the order it happens. In-world dates are on the Sea Circle
          Calendar: the story before the timeskip is the year 1522, and after it 1524. Prefer to scroll it?{" "}
          <TextLink href="/#timeline">Open the illustrated timeline</TextLink>.
        </>
      }
      schema={[
        collectionSchema({
          path: paths.arcs,
          name: TITLE,
          description: DESCRIPTION,
          items: ALL_ARCS.map((arc) => ({ name: `${arc.name} Arc`, path: paths.arc(arc.id) })),
        }),
      ]}
    >
      {SAGAS.map((saga, index) => (
        <Section key={saga.id} title={`${index + 1}. ${saga.name}`} id={saga.id}>
          <p>
            <em>{saga.tagline}</em> Sea Circle Calendar {saga.years}. <TextLink href={paths.saga(saga.id)}>About the {saga.name}</TextLink>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left text-[14.5px]">
              <thead>
                <tr className="border-b border-ink-500/40 text-[11px] uppercase tracking-[0.12em] text-ink-500">
                  <th scope="col" className="py-1.5 pr-3 font-semibold">#</th>
                  <th scope="col" className="py-1.5 pr-3 font-semibold">Arc</th>
                  <th scope="col" className="py-1.5 pr-3 font-semibold">In-world date</th>
                  <th scope="col" className="py-1.5 pr-3 font-semibold">Chapters</th>
                  <th scope="col" className="py-1.5 font-semibold">Joined the crew</th>
                </tr>
              </thead>
              <tbody>
                {saga.arcs.map((arc) => (
                  <tr key={arc.id} className="border-b border-ink-500/15 align-top">
                    <td className="py-1.5 pr-3 tabular-nums text-ink-500">{arcNumber(arc)}</td>
                    <th scope="row" className="py-1.5 pr-3 font-normal">
                      <TextLink href={paths.arc(arc.id)}>{arc.name}</TextLink>
                    </th>
                    <td className="py-1.5 pr-3">{arc.dateLabel}</td>
                    <td className="whitespace-nowrap py-1.5 pr-3">{arc.chapters.replace("Ch. ", "")}</td>
                    <td className="py-1.5">{arc.crewJoined.length > 0 ? listOf(arc.crewJoined.map((id) => CREW[id].name)) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ))}
      <SourceNote />
    </ContentShell>
  );
}
