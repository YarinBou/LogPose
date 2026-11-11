import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentShell, FactList, Section, SeriesNav, SourceNote, TextLink } from "@/components/content/ContentShell";
import { CREW, SAGAS } from "@/data/timeline";
import { arcNumber, berries, clip, getSaga, listOf, neighbours, paths } from "@/lib/content";
import { collectionSchema, pageMetadata } from "@/lib/seo";

interface SagaPageProps {
  params: Promise<{ saga: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return SAGAS.map((saga) => ({ saga: saga.id }));
}

function describe(sagaId: string): { title: string; description: string } | undefined {
  const saga = getSaga(sagaId);
  if (!saga) return undefined;
  const arcNames = listOf(saga.arcs.map((arc) => arc.name));
  return {
    title: `${saga.name}: Arcs in Order, Dates and Chapters`,
    description: clip(
      `The ${saga.name} of One Piece: ${saga.arcs.length} ${saga.arcs.length === 1 ? "arc" : "arcs"} (${arcNames}) with in-world dates, manga chapters, bounties and the crew members who joined.`,
    ),
  };
}

export async function generateMetadata({ params }: SagaPageProps): Promise<Metadata> {
  const { saga: sagaId } = await params;
  const meta = describe(sagaId);
  if (!meta) return {};
  return pageMetadata({ ...meta, path: paths.saga(sagaId) });
}

export default async function SagaPage({ params }: SagaPageProps) {
  const { saga: sagaId } = await params;
  const saga = getSaga(sagaId);
  const meta = describe(sagaId);
  if (!saga || !meta) notFound();

  const { previous, next } = neighbours(SAGAS, saga);
  const joined = saga.arcs.flatMap((arc) => arc.crewJoined);
  const first = saga.arcs[0];
  const last = saga.arcs[saga.arcs.length - 1];
  const chapterStart = first.chapters.replace("Ch. ", "").split("-")[0].replace(" onward", "");
  const chapterEnd = last.chapters.replace("Ch. ", "").split("-").pop() ?? "";
  const chapters = chapterEnd.includes("onward") ? `${chapterStart} onward` : `${chapterStart}-${chapterEnd}`;

  return (
    <ContentShell
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Arcs", path: paths.arcs },
        { name: saga.name, path: paths.saga(saga.id) },
      ]}
      kicker={`Saga ${SAGAS.indexOf(saga) + 1} of ${SAGAS.length} · Sea Circle Calendar ${saga.years}`}
      title={saga.name}
      lead={saga.tagline}
      schema={[
        collectionSchema({
          path: paths.saga(saga.id),
          name: saga.name,
          description: meta.description,
          items: saga.arcs.map((arc) => ({ name: `${arc.name} Arc`, path: paths.arc(arc.id) })),
        }),
      ]}
    >
      <Section title="Key facts">
        <FactList
          facts={[
            { label: "Arcs", value: `${saga.arcs.length}: ${listOf(saga.arcs.map((arc) => arc.name))}` },
            { label: "Sea Circle Calendar", value: saga.years },
            { label: "Begins", value: first.dateLabel },
            { label: "Manga chapters", value: chapters },
            {
              label: "Joined the crew",
              value:
                joined.length > 0
                  ? joined.map((id, index) => (
                      <span key={id}>
                        {index > 0 ? ", " : ""}
                        <TextLink href={paths.crewMember(id)}>{CREW[id].name}</TextLink>
                      </span>
                    ))
                  : "Nobody new",
            },
            { label: "Position", value: `Saga ${SAGAS.indexOf(saga) + 1} of ${SAGAS.length}` },
          ]}
        />
      </Section>

      <Section title={`Arcs of the ${saga.name}, in order`}>
        <ol className="space-y-5">
          {saga.arcs.map((arc) => (
            <li key={arc.id}>
              <h3 className="font-display text-2xl leading-tight text-ink-900">
                <TextLink href={paths.arc(arc.id)} className="no-underline">
                  {arcNumber(arc)}. {arc.name}
                </TextLink>
              </h3>
              <p className="text-[13px] font-semibold text-redline-600">
                {arc.dateLabel} · {arc.chapters} · {arc.place}
              </p>
              <p className="mt-1">{arc.summary}</p>
              {arc.bountyUpdates ? (
                <p className="mt-1 text-[14px]">
                  <strong>Bounties issued:</strong>{" "}
                  {listOf(arc.bountyUpdates.map((update) => `${CREW[update.crew].name} ${berries(update.amount)}`))}.
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </Section>

      <SeriesNav
        previous={previous ? { label: previous.name, href: paths.saga(previous.id) } : undefined}
        next={next ? { label: next.name, href: paths.saga(next.id) } : undefined}
      />
      <SourceNote />
    </ContentShell>
  );
}
