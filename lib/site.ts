/**
 * Site-wide facts used by metadata, the sitemap, structured data and share images.
 *
 * The public address is read from the environment so the same build works everywhere:
 *   NEXT_PUBLIC_SITE_URL            set this once a custom domain is attached
 *   VERCEL_PROJECT_PRODUCTION_URL   provided by Vercel: the production hostname
 * Without either (local development) it falls back to localhost.
 */

import { LOCATIONS } from "@/data/map";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "LogPose";

export const SITE_TITLE = "One Piece Timeline and World Map";

/** Named places on the map, not counting the markers for crews and organisations. */
export const PLACE_COUNT = LOCATIONS.filter((location) => !location.faction).length;

export const SITE_DESCRIPTION = `The complete One Piece timeline and world map: every arc of the Straw Hat Pirates' voyage in order, dated on the Sea Circle Calendar, with crew bounties and ${PLACE_COUNT} charted islands and towns in 2D and 3D.`;

/** Date the content was last reviewed. Feeds sitemap lastModified and dateModified in structured data. */
export const LAST_UPDATED = "2026-11-11";

/** Absolute URL for a path on this site. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SOURCES = {
  timeline: "https://thelibraryofohara.com/the-one-piece-timeline/",
  map: "https://thelibraryofohara.com/onepieceworldmap/",
} as const;
