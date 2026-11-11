import { berries, CREW_LIST, getCrewMember } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Straw Hat Pirate: role, join date and bounty history on LogPose";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return CREW_LIST.map((member) => ({ member: member.id }));
}

/** Share image for one crew member: name, role and current bounty. */
export default async function Image({ params }: { params: Promise<{ member: string }> }) {
  const { member: memberId } = await params;
  const member = getCrewMember(memberId);
  if (!member) return ogCard({ kicker: "Straw Hat Pirates", title: "The crew" });
  return ogCard({
    kicker: `Straw Hat Pirates · ${member.role}`,
    title: member.name,
    subtitle: `"${member.epithet}" · Bounty ${berries(member.bounty)}`,
  });
}
