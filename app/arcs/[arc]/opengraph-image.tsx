import { ALL_ARCS } from "@/data/timeline";
import { getArc, sagaOf } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const alt = "One Piece arc: date, chapters and summary on LogPose";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return ALL_ARCS.map((arc) => ({ arc: arc.id }));
}

/** Share image for one arc: its name, saga, date and chapters. */
export default async function Image({ params }: { params: Promise<{ arc: string }> }) {
  const { arc: arcId } = await params;
  const arc = getArc(arcId);
  if (!arc) return ogCard({ kicker: "One Piece arcs", title: "All arcs in order" });
  return ogCard({
    kicker: sagaOf(arc).name,
    title: `${arc.name} Arc`,
    subtitle: `${arc.dateLabel.startsWith("Not yet dated") ? `Sea Circle Calendar ${arc.opYear}` : arc.dateLabel} · ${arc.chapters}`,
  });
}
