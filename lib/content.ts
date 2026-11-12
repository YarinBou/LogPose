/**
 * Views over the timeline and map data, shared by the content pages, the sitemap,
 * structured data and the plain-text exports. Nothing here adds facts: it only
 * cross-references what data/timeline.ts and data/map.ts already hold.
 */
import { LOCATIONS, REGIONS, getLocation, regionName, type MapLocation, type RegionId } from "@/data/map";
import { ALL_ARCS, CREW, SAGAS, arcsAtLocation, type Arc, type CrewId, type CrewMember, type Saga } from "@/data/timeline";
import { formatBerries } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Text helpers                                                         */
/* ------------------------------------------------------------------ */

/** Cut text to at most `limit` characters at a word boundary, for meta descriptions. */
export function clip(text: string, limit = 158): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), limit - 30)).replace(/[\s,.;:]+$/, "")}…`;
}

/** 3000000000 -> "3,000,000,000 Berries". */
export function berries(amount: number): string {
  return `${formatBerries(amount)} Berries`;
}

/** ["a", "b", "c"] -> "a, b and c". */
export function listOf(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/* ------------------------------------------------------------------ */
/* Arcs and sagas                                                       */
/* ------------------------------------------------------------------ */

const SAGA_OF_ARC = new Map<string, Saga>(SAGAS.flatMap((saga) => saga.arcs.map((arc) => [arc.id, saga] as const)));

export function getArc(id: string): Arc | undefined {
  return ALL_ARCS.find((arc) => arc.id === id);
}

export function getSaga(id: string): Saga | undefined {
  return SAGAS.find((saga) => saga.id === id);
}

export function sagaOf(arc: Arc): Saga {
  const saga = SAGA_OF_ARC.get(arc.id);
  if (!saga) throw new Error(`Arc "${arc.id}" belongs to no saga.`);
  return saga;
}

/** Position of an arc in the whole voyage, starting at 1. */
export function arcNumber(arc: Arc): number {
  return ALL_ARCS.indexOf(arc) + 1;
}

export function neighbours<T>(list: T[], item: T): { previous?: T; next?: T } {
  const index = list.indexOf(item);
  return { previous: list[index - 1], next: list[index + 1] };
}

/** The key character's bounty as a sentence fragment. */
export function bountyText(arc: Arc): string {
  const { bounty, bountyNote } = arc.keyCharacter;
  if (bounty === null) return bountyNote ?? "No bounty";
  return bountyNote ? `${berries(bounty)} (${bountyNote.replace(/\.$/, "").toLowerCase()})` : berries(bounty);
}

/* ------------------------------------------------------------------ */
/* Crew                                                                 */
/* ------------------------------------------------------------------ */

/** The crew in the order they came aboard. */
export const CREW_ORDER: CrewId[] = ["luffy", "zoro", "nami", "usopp", "sanji", "chopper", "robin", "franky", "brook", "jinbe"];

export const CREW_LIST: CrewMember[] = CREW_ORDER.map((id) => CREW[id]);

export function getCrewMember(id: string): CrewMember | undefined {
  return CREW_ORDER.includes(id as CrewId) ? CREW[id as CrewId] : undefined;
}

/** The arc in which a member joined. */
export function joinArc(id: CrewId): Arc | undefined {
  return ALL_ARCS.find((arc) => arc.crewJoined.includes(id));
}

export interface BountyStep {
  arc: Arc;
  amount: number;
  note?: string;
}

/** Every bounty the timeline records for a member, oldest first. */
export function bountyHistory(id: CrewId): BountyStep[] {
  return ALL_ARCS.flatMap((arc) =>
    (arc.bountyUpdates ?? []).filter((update) => update.crew === id).map((update) => ({ arc, amount: update.amount, note: update.note })),
  );
}

/* ------------------------------------------------------------------ */
/* Locations                                                            */
/* ------------------------------------------------------------------ */

/**
 * Places that get a page of their own: story landmarks, anywhere the timeline visits,
 * anywhere the Ohara map details with points of interest, and anywhere with a written description.
 */
export const LANDMARKS: MapLocation[] = LOCATIONS.filter(
  (location) =>
    !location.faction && (location.tier === 1 || location.pois.length > 0 || Boolean(location.description) || arcsAtLocation(location.id).length > 0),
);

const LANDMARK_IDS = new Set(LANDMARKS.map((location) => location.id));

export function isLandmark(id: string): boolean {
  return LANDMARK_IDS.has(id);
}

export function getLandmark(id: string): MapLocation | undefined {
  return LANDMARK_IDS.has(id) ? getLocation(id) : undefined;
}

/** Charted places closest to a location on the Ohara map, nearest first. */
export function nearestPlaces(location: MapLocation, count = 6): MapLocation[] {
  return LOCATIONS.filter((other) => other.id !== location.id && !other.faction && !other.unplaced)
    .map((other) => ({ other, distance: Math.hypot(other.x - location.x, other.y - location.y) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map(({ other }) => other);
}

export interface RegionGroup {
  id: RegionId;
  name: string;
  blurb: string;
  places: MapLocation[];
}

/** Every charted place grouped by sea, landmarks first and then by name. */
export const PLACES_BY_REGION: RegionGroup[] = REGIONS.map((region) => ({
  id: region.id,
  name: region.name,
  blurb: region.blurb,
  places: LOCATIONS.filter((location) => location.region === region.id && !location.faction).sort(
    (a, b) => a.tier - b.tier || a.name.localeCompare(b.name),
  ),
})).filter((group) => group.places.length > 0);

/** One-sentence description of where a place is. */
export function placeSentence(location: MapLocation): string {
  const status = location.destroyed ? " It no longer exists in the present day of the story." : location.unplaced ? " Its exact position is not confirmed." : "";
  return `${location.name} is charted in the ${regionName(location.region)} of the One Piece world (${location.note}).${status}`;
}

/* ------------------------------------------------------------------ */
/* Routes                                                               */
/* ------------------------------------------------------------------ */

export const paths = {
  arcs: "/arcs",
  arc: (id: string) => `/arcs/${id}`,
  saga: (id: string) => `/sagas/${id}`,
  crew: "/crew",
  crewMember: (id: string) => `/crew/${id}`,
  locations: "/locations",
  location: (id: string) => `/locations/${id}`,
  map3d: "/3d-world-map",
} as const;
