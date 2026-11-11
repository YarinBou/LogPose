import Link from "next/link";
import { regionName, type MapLocation, type Poneglyph } from "@/data/map";
import { arcsAtLocation } from "@/data/timeline";
import { isLandmark, paths } from "@/lib/content";

interface DetailsProps {
  /**
   * Prefix for links to timeline cards. The 2D map lives on the home page and links with
   * "#arc-..."; the 3D map is its own page and needs "/#arc-...".
   */
  arcHrefBase?: string;
}

/** Everything known about one place: where it is, when the crew was there, and what is inside it. */
export function LocationDetails({ location, arcHrefBase = "" }: DetailsProps & { location: MapLocation }) {
  const arcs = arcsAtLocation(location.id);
  const tags = [
    location.faction ? "Crew or organisation" : null,
    location.unplaced ? "Position unconfirmed" : null,
    location.destroyed ? "Destroyed" : null,
  ].filter((tag): tag is string => tag !== null);

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">{regionName(location.region)}</p>
      <h3 className="mt-0.5 font-display text-4xl leading-none text-ink-900">{location.name}</h3>
      <p className="mt-1.5 text-sm text-ink-700">{location.note}</p>
      {isLandmark(location.id) ? (
        <p className="mt-1.5">
          <Link
            href={paths.location(location.id)}
            className="text-[13px] font-semibold text-ocean-700 underline decoration-ocean-700/40 underline-offset-2 hover:text-ocean-600"
          >
            About {location.name}
          </Link>
        </p>
      ) : null}

      {tags.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag} className="rounded-full border border-redline-700/40 bg-redline-500/10 px-2 py-0.5 text-[11px] font-semibold text-redline-700">
              {tag}
            </li>
          ))}
        </ul>
      ) : null}

      {arcs.length > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">On the timeline</p>
          <ul className="mt-1.5 space-y-1">
            {arcs.map((arc) => (
              <li key={arc.id}>
                <a
                  href={`${arcHrefBase}#arc-${arc.id}`}
                  className="text-sm font-semibold text-ocean-700 underline decoration-ocean-700/40 underline-offset-2 hover:text-ocean-600"
                >
                  {arc.name}
                </a>
                <span className="text-[12.5px] text-ink-500"> · {arc.dateLabel}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {location.pois.length > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">Points of interest ({location.pois.length})</p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {location.pois.map((poi) => (
              <li key={poi} className="rounded-sm border border-ink-500/30 bg-parchment-50/70 px-1.5 py-0.5 text-[12px] text-ink-700">
                {poi}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function PoneglyphDetails({ stone }: { stone: Poneglyph }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">
        {stone.road ? "Road Poneglyph" : "Poneglyph"}
      </p>
      <h3 className="mt-0.5 font-display text-3xl leading-none text-ink-900">{stone.name}</h3>
      <dl className="mt-3 space-y-2 text-sm text-ink-700">
        {stone.location ? (
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">Where</dt>
            <dd>{stone.location}</dd>
          </div>
        ) : null}
        {stone.readBy ? (
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">Read by</dt>
            <dd>{stone.readBy}</dd>
          </div>
        ) : null}
      </dl>
      {stone.road ? (
        <p className="mt-3 border-l-2 border-redline-500 pl-2.5 text-[13px] leading-snug text-ink-700">
          One of four red stones. Each gives a position; where the four lines cross lies Laugh Tale.
        </p>
      ) : null}
    </div>
  );
}
