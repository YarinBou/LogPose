import type { Metadata } from "next";
import { ContentShell, Section, SourceNote, TextLink } from "@/components/content/ContentShell";
import { isLandmark, LANDMARKS, paths, PLACES_BY_REGION } from "@/lib/content";
import { collectionSchema, pageMetadata } from "@/lib/seo";

const TOTAL = PLACES_BY_REGION.reduce((sum, group) => sum + group.places.length, 0);

const TITLE = "One Piece World Map: All Locations by Sea";
const DESCRIPTION = `Every charted place in the One Piece world, ${TOTAL} islands, kingdoms and towns, listed by sea: East Blue, North Blue, West Blue, South Blue, Paradise, the New World, the Red Line and the Calm Belt.`;

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: paths.locations, type: "website" });

export default function LocationsPage() {
  return (
    <ContentShell
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Locations", path: paths.locations },
      ]}
      kicker={`${TOTAL} places · ${PLACES_BY_REGION.length} regions`}
      title="Locations of the One Piece World"
      lead={
        <>
          The Red Line and the Grand Line divide the world into four Blues. This is every place charted on the Library of
          Ohara&apos;s map, grouped by sea. Places with a page of their own are linked. Explore them on the{" "}
          <TextLink href="/#map">2D world map</TextLink> or the <TextLink href={paths.map3d}>3D globe</TextLink>.
        </>
      }
      schema={[
        collectionSchema({
          path: paths.locations,
          name: TITLE,
          description: DESCRIPTION,
          items: LANDMARKS.map((location) => ({ name: location.name, path: paths.location(location.id) })),
        }),
      ]}
    >
      <nav aria-label="Seas" className="flex flex-wrap gap-2">
        {PLACES_BY_REGION.map((group) => (
          <a
            key={group.id}
            href={`#${group.id}`}
            className="rounded-full border border-ink-500/40 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-700 hover:border-redline-600 hover:text-redline-600"
          >
            {group.name} ({group.places.length})
          </a>
        ))}
      </nav>

      {PLACES_BY_REGION.map((group) => (
        <Section key={group.id} id={group.id} title={`${group.name} (${group.places.length})`}>
          <p>{group.blurb}</p>
          <ul className="columns-1 gap-x-8 sm:columns-2 lg:columns-3">
            {group.places.map((place) => (
              <li key={place.id} className="break-inside-avoid py-0.5 text-[14.5px]">
                {isLandmark(place.id) ? <TextLink href={paths.location(place.id)}>{place.name}</TextLink> : place.name}
                {place.destroyed ? <span className="text-ink-500"> (destroyed)</span> : null}
              </li>
            ))}
          </ul>
        </Section>
      ))}
      <SourceNote />
    </ContentShell>
  );
}
