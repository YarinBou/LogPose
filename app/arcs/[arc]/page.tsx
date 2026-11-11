import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentShell, FactList, Section, SeriesNav, SourceNote, TextLink, type Fact } from "@/components/content/ContentShell";
import { getLocation } from "@/data/map";
import { ALL_ARCS, CREW } from "@/data/timeline";
import { arcNumber, berries, bountyText, clip, getArc, isLandmark, neighbours, paths, sagaOf } from "@/lib/content";
import { articleSchema, pageMetadata } from "@/lib/seo";

interface ArcPageProps {
  params: Promise<{ arc: string }>;
}

// Only the arcs in the data exist; anything else is a 404 rather than an empty page.
export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_ARCS.map((arc) => ({ arc: arc.id }));
}

function describe(arcId: string): { title: string; description: string } | undefined {
  const arc = getArc(arcId);
  if (!arc) return undefined;
  return {
    title: `${arc.name} Arc: Date, Chapters and Summary`,
    description: clip(`${arc.name} arc of One Piece (${arc.chapters.replace("Ch.", "chapters")}), ${arc.dateLabel}. ${arc.summary}`),
  };
}

export async function generateMetadata({ params }: ArcPageProps): Promise<Metadata> {
  const { arc: arcId } = await params;
  const meta = describe(arcId);
  if (!meta) return {};
  return pageMetadata({ ...meta, path: paths.arc(arcId) });
}

export default async function ArcPage({ params }: ArcPageProps) {
  const { arc: arcId } = await params;
  const arc = getArc(arcId);
  const meta = describe(arcId);
  if (!arc || !meta) notFound();

  const saga = sagaOf(arc);
  const { previous, next } = neighbours(ALL_ARCS, arc);
  const places = arc.locationIds.map((id) => getLocation(id)).filter((place) => place !== undefined);
  const character = arc.keyCharacter;

  const facts: Fact[] = [
    { label: "Saga", value: <TextLink href={paths.saga(saga.id)}>{saga.name}</TextLink> },
    { label: "Arc number", value: `${arcNumber(arc)} of ${ALL_ARCS.length}` },
    { label: "In-world date", value: arc.dateLabel },
    { label: "Sea Circle Calendar year", value: String(arc.opYear) },
    { label: "Manga chapters", value: arc.chapters.replace("Ch. ", "Chapters ") },
    { label: "Setting", value: arc.place },
    {
      label: "Joined the crew",
      value:
        arc.crewJoined.length > 0
          ? arc.crewJoined.map((id, index) => (
              <span key={id}>
                {index > 0 ? ", " : ""}
                <TextLink href={paths.crewMember(id)}>{CREW[id].name}</TextLink> ({CREW[id].role.toLowerCase()})
              </span>
            ))
          : "Nobody new",
    },
  ];
  if (arc.guests) facts.push({ label: "Sailing with the crew", value: arc.guests.join(", ") });

  return (
    <ContentShell
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Arcs", path: paths.arcs },
        { name: saga.name, path: paths.saga(saga.id) },
        { name: arc.name, path: paths.arc(arc.id) },
      ]}
      kicker={`${saga.name} · Arc ${arcNumber(arc)} of ${ALL_ARCS.length}`}
      title={`${arc.name} Arc`}
      lead={arc.summary}
      schema={[
        articleSchema({
          path: paths.arc(arc.id),
          headline: `${arc.name} Arc`,
          description: meta.description,
          about: [{ "@type": "Thing", name: `${arc.name} Arc`, description: `Story arc of One Piece, part of the ${saga.name}.` }],
        }),
      ]}
    >
      <Section title="Key facts">
        <FactList facts={facts} />
      </Section>

      <Section title="When it happens">
        <p>
          The {arc.name} arc takes place in the year {arc.opYear} of the Sea Circle Calendar
          {arc.dateLabel.startsWith("Not yet dated") ? (
            ". The Library of Ohara timeline ends at Egghead, so this arc has no day-by-day dates yet"
          ) : (
            <>
              : <strong>{arc.dateLabel}</strong>
            </>
          )}
          . It runs
          through {arc.chapters.replace("Ch. ", "chapters ")} of the manga and is arc {arcNumber(arc)} of {ALL_ARCS.length} in the
          Straw Hats&apos; voyage
          {previous ? (
            <>
              , after <TextLink href={paths.arc(previous.id)}>{previous.name}</TextLink>
            </>
          ) : null}
          {next ? (
            <>
              {previous ? " and" : ","} before <TextLink href={paths.arc(next.id)}>{next.name}</TextLink>
            </>
          ) : null}
          .
        </p>
      </Section>

      <Section title="Where it happens">
        <p>{arc.place}.</p>
        {places.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {places.map((place) => (
              <li key={place.id}>
                {isLandmark(place.id) ? <TextLink href={paths.location(place.id)}>{place.name}</TextLink> : <strong>{place.name}</strong>}: {place.note}
              </li>
            ))}
          </ul>
        ) : null}
        {arc.inspiration ? (
          <p>
            <strong>Real-world echo:</strong> {arc.inspiration}
          </p>
        ) : null}
        <p>
          See it on the <TextLink href="/#map">2D world map</TextLink> or the <TextLink href={paths.map3d}>3D globe</TextLink>.
        </p>
      </Section>

      <Section title="Who to know">
        <p>
          <strong>{character.name}</strong>, &ldquo;{character.epithet}&rdquo;, of {character.affiliation}. Bounty: {bountyText(arc)}.
        </p>
      </Section>

      {arc.bountyUpdates ? (
        <Section title="Bounties issued">
          <ul className="list-disc space-y-1 pl-5">
            {arc.bountyUpdates.map((update) => (
              <li key={update.crew}>
                <TextLink href={paths.crewMember(update.crew)}>{CREW[update.crew].name}</TextLink>: {berries(update.amount)}
                {update.note ? ` (${update.note})` : ""}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {arc.usoppLies ? (
        <Section title="Usopp's lies that came true">
          <ul className="space-y-3">
            {arc.usoppLies.map((lie) => (
              <li key={lie.lie}>
                <strong>The lie:</strong> {lie.lie}
                <br />
                <strong>{lie.fulfilled ? "How it came true:" : "Where it stands:"}</strong> {lie.note}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <p>
        <TextLink href={`/#arc-${arc.id}`}>Find {arc.name} on the illustrated timeline</TextLink>
      </p>

      <SeriesNav
        previous={previous ? { label: `${previous.name} Arc`, href: paths.arc(previous.id) } : undefined}
        next={next ? { label: `${next.name} Arc`, href: paths.arc(next.id) } : undefined}
      />
      <SourceNote />
    </ContentShell>
  );
}
