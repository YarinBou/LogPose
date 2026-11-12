import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentShell, FactList, Section, SourceNote, TextLink, type Fact } from "@/components/content/ContentShell";
import { REGIONS, regionName, type MapLocation, type Visitor } from "@/data/map";
import { arcsAtLocation } from "@/data/timeline";
import { clip, getLandmark, isLandmark, LANDMARKS, listOf, nearestPlaces, paths, placeSentence } from "@/lib/content";
import { articleSchema, pageMetadata } from "@/lib/seo";

interface LocationPageProps {
  params: Promise<{ location: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return LANDMARKS.map((location) => ({ location: location.id }));
}

const STATUS_LABEL = { active: "Active", destroyed: "Destroyed", occupied: "Occupied", unknown: "Unknown" } as const;

const VISITOR_HEADINGS: { kind: Visitor["kind"]; label: string }[] = [
  { kind: "crew", label: "Straw Hat Pirates" },
  { kind: "character", label: "Other characters" },
  { kind: "organisation", label: "Crews and organisations" },
];

function statusOf(location: MapLocation): string {
  if (location.status) return STATUS_LABEL[location.status];
  return location.unplaced ? "Position unconfirmed" : "Charted";
}

function describe(locationId: string): { title: string; description: string } | undefined {
  const location = getLandmark(locationId);
  if (!location) return undefined;
  const arcs = arcsAtLocation(location.id);
  const visited = arcs.length > 0 ? ` The Straw Hats are here in the ${listOf(arcs.map((arc) => arc.name))} ${arcs.length === 1 ? "arc" : "arcs"}.` : "";
  const sites = location.pois.length > 0 ? ` Points of interest: ${listOf(location.pois.slice(0, 5))}.` : "";
  return {
    title: `${location.name}: Location on the One Piece World Map`,
    description: clip(location.description ? `${location.name} (${regionName(location.region)}): ${location.description}` : `${placeSentence(location)}${visited}${sites}`),
  };
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { location: locationId } = await params;
  const meta = describe(locationId);
  if (!meta) return {};
  return pageMetadata({ ...meta, path: paths.location(locationId) });
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { location: locationId } = await params;
  const location = getLandmark(locationId);
  const meta = describe(locationId);
  if (!location || !meta) notFound();

  const arcs = arcsAtLocation(location.id);
  const region = REGIONS.find((entry) => entry.id === location.region);
  const nearby = nearestPlaces(location);

  const facts: Fact[] = [
    { label: "Sea", value: <TextLink href={`${paths.locations}#${location.region}`}>{regionName(location.region)}</TextLink> },
    { label: "Position", value: location.note },
    { label: "Status", value: statusOf(location) },
  ];
  if (location.saga) facts.push({ label: "Saga", value: location.saga });
  if (location.arc) facts.push({ label: "Arc", value: location.arc });
  if (location.firstMangaChapter) facts.push({ label: "First manga chapter", value: `Chapter ${location.firstMangaChapter}` });
  if (location.firstAnimeEpisode) facts.push({ label: "First anime episode", value: `Episode ${location.firstAnimeEpisode}` });
  if (location.ruler) facts.push({ label: "Ruler", value: location.ruler });
  if (location.affiliation) facts.push({ label: "Affiliation", value: location.affiliation });
  if (location.population) facts.push({ label: "Population", value: location.population });
  if (location.climate) facts.push({ label: "Climate", value: location.climate });
  if (location.features) facts.push({ label: "Notable features", value: location.features });
  if (arcs.length > 0 && !location.firstMangaChapter) facts.push({ label: "First visited", value: `${arcs[0].name}, ${arcs[0].dateLabel}` });
  if (location.pois.length > 0) facts.push({ label: "Points of interest", value: String(location.pois.length) });

  return (
    <ContentShell
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Locations", path: paths.locations },
        { name: location.name, path: paths.location(location.id) },
      ]}
      kicker={regionName(location.region)}
      title={location.name}
      lead={location.description ?? placeSentence(location)}
      schema={[
        articleSchema({
          path: paths.location(location.id),
          headline: `${location.name}: location on the One Piece world map`,
          description: meta.description,
          about: [{ "@type": "Place", name: location.name, description: location.description ?? `Fictional place in One Piece: ${location.note}.` }],
        }),
      ]}
    >
      <Section title="Key facts">
        <FactList facts={facts} />
      </Section>

      {location.keyEvents && location.keyEvents.length > 0 ? (
        <Section title={`What happened at ${location.name}`}>
          <ol className="list-decimal space-y-1 pl-5">
            {location.keyEvents.map((event) => (
              <li key={event}>{event}</li>
            ))}
          </ol>
        </Section>
      ) : null}

      {location.visitedBy && location.visitedBy.length > 0 ? (
        <Section title={`Who has been to ${location.name}`}>
          {VISITOR_HEADINGS.map(({ kind, label }) => {
            const group = (location.visitedBy ?? []).filter((visitor) => visitor.kind === kind);
            if (group.length === 0) return null;
            return (
              <p key={kind}>
                <strong>{label}:</strong>{" "}
                {group.map((visitor) => (visitor.note ? `${visitor.name} (${visitor.note})` : visitor.name)).join(", ")}.
              </p>
            );
          })}
        </Section>
      ) : null}

      <Section title={`Where ${location.name} is`}>
        <p>
          {placeSentence(location)} {region?.blurb}
        </p>
        <p>
          <TextLink href={`/?place=${location.id}`}>Show {location.name} on the 2D world map</TextLink>, or turn the{" "}
          <TextLink href={paths.map3d}>3D globe</TextLink> to it.
        </p>
      </Section>

      {arcs.length > 0 ? (
        <Section title="On the timeline">
          <ul className="space-y-3">
            {arcs.map((arc) => (
              <li key={arc.id}>
                <TextLink href={paths.arc(arc.id)}>{arc.name} Arc</TextLink>
                <span className="text-[13px] font-semibold text-redline-600"> · {arc.dateLabel} · {arc.chapters}</span>
                <br />
                {arc.summary}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {location.pois.length > 0 ? (
        <Section title={`Places in ${location.name}`}>
          <p>The Library of Ohara&apos;s detail map names {location.pois.length} points of interest here:</p>
          <ul className="columns-1 gap-x-8 sm:columns-2">
            {location.pois.map((poi) => (
              <li key={poi} className="break-inside-avoid py-0.5">
                {poi}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Nearby on the map">
        <ul className="columns-1 gap-x-8 sm:columns-2">
          {nearby.map((place) => (
            <li key={place.id} className="break-inside-avoid py-0.5">
              {isLandmark(place.id) ? <TextLink href={paths.location(place.id)}>{place.name}</TextLink> : place.name}
              <span className="text-ink-500"> · {regionName(place.region)}</span>
            </li>
          ))}
        </ul>
      </Section>
      <SourceNote />
    </ContentShell>
  );
}
