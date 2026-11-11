import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";
import { ALL_ARCS } from "@/data/timeline";
import { LOCATIONS } from "@/data/map";

export const alt = "LogPose: the One Piece timeline and world map";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Default share image, used by every page that does not define its own. */
export default function Image() {
  return ogCard({
    kicker: "Every arc. Every island.",
    title: "One Piece Timeline & World Map",
    subtitle: `${ALL_ARCS.length} arcs in order, crew bounties, and ${LOCATIONS.filter((l) => !l.faction).length} charted places in 2D and 3D`,
  });
}
