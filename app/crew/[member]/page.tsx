import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentShell, FactList, Section, SeriesNav, SourceNote, TextLink } from "@/components/content/ContentShell";
import type { CrewMember } from "@/data/timeline";
import { berries, bountyHistory, clip, CREW_LIST, getCrewMember, joinArc, neighbours, paths } from "@/lib/content";
import { articleSchema, pageMetadata } from "@/lib/seo";

interface MemberPageProps {
  params: Promise<{ member: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return CREW_LIST.map((member) => ({ member: member.id }));
}

function intro(member: CrewMember): string {
  const arc = joinArc(member.id);
  const joined =
    member.id === "luffy"
      ? `Sets sail from Foosha Village in the ${arc?.name ?? "first"} arc (${arc?.dateLabel ?? "1522"}).`
      : arc
        ? `Joins the crew in the ${arc.name} arc (${arc.dateLabel}).`
        : "";
  return `${member.name}, known as "${member.epithet}", is the ${member.role.toLowerCase()} of the Straw Hat Pirates. ${joined} Current bounty: ${berries(member.bounty)}.`;
}

function describe(memberId: string): { title: string; description: string } | undefined {
  const member = getCrewMember(memberId);
  if (!member) return undefined;
  return {
    title: `${member.name}: Bounty History, Role and Join Date`,
    description: clip(intro(member) + ` Born ${member.born}.`),
  };
}

export async function generateMetadata({ params }: MemberPageProps): Promise<Metadata> {
  const { member: memberId } = await params;
  const meta = describe(memberId);
  if (!meta) return {};
  return pageMetadata({ ...meta, path: paths.crewMember(memberId) });
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { member: memberId } = await params;
  const member = getCrewMember(memberId);
  const meta = describe(memberId);
  if (!member || !meta) notFound();

  const arc = joinArc(member.id);
  const history = bountyHistory(member.id);
  const position = CREW_LIST.indexOf(member) + 1;
  const { previous, next } = neighbours(CREW_LIST, member);

  return (
    <ContentShell
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Crew", path: paths.crew },
        { name: member.name, path: paths.crewMember(member.id) },
      ]}
      kicker={`Straw Hat Pirates · ${member.role}`}
      title={member.name}
      lead={intro(member)}
      schema={[
        articleSchema({
          path: paths.crewMember(member.id),
          headline: `${member.name}: bounty history, role and join date`,
          description: meta.description,
          about: [{ "@type": "Person", name: member.name, alternateName: member.epithet, description: `Fictional character: ${member.role.toLowerCase()} of the Straw Hat Pirates in One Piece.` }],
        }),
      ]}
    >
      <Section title="Key facts">
        <FactList
          facts={[
            { label: "Role", value: member.role },
            { label: "Epithet", value: `"${member.epithet}"` },
            { label: "Current bounty", value: berries(member.bounty) },
            { label: "Birthday", value: `${member.born} (Sea Circle Calendar)` },
            {
              label: member.id === "luffy" ? "Sets sail" : "Joined the crew",
              value: arc ? (
                <>
                  <TextLink href={paths.arc(arc.id)}>{arc.name}</TextLink>, {arc.dateLabel}
                </>
              ) : (
                "-"
              ),
            },
            { label: "Join order", value: `${position} of ${CREW_LIST.length}` },
          ]}
        />
      </Section>

      <Section title={`${member.name}'s bounty history`}>
        {history.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] border-collapse text-left text-[14.5px]">
                <thead>
                  <tr className="border-b border-ink-500/40 text-[11px] uppercase tracking-[0.12em] text-ink-500">
                    <th scope="col" className="py-1.5 pr-3 font-semibold">Issued after</th>
                    <th scope="col" className="py-1.5 pr-3 font-semibold">In-world date</th>
                    <th scope="col" className="py-1.5 pr-3 text-right font-semibold">Bounty (Berries)</th>
                    <th scope="col" className="py-1.5 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((step) => (
                    <tr key={step.arc.id} className="border-b border-ink-500/15 align-top">
                      <th scope="row" className="py-1.5 pr-3 font-normal">
                        <TextLink href={paths.arc(step.arc.id)}>{step.arc.name}</TextLink>
                      </th>
                      <td className="py-1.5 pr-3">{step.arc.dateLabel}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{berries(step.amount).replace(" Berries", "")}</td>
                      <td className="py-1.5">{step.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              {history.length > 1
                ? `The timeline records ${history.length} bounties for ${member.name}, rising from ${berries(history[0].amount)} to ${berries(history[history.length - 1].amount)}.`
                : `The timeline records one bounty for ${member.name}: ${berries(history[0].amount)}.`}
            </p>
          </>
        ) : (
          <p>The timeline records no bounty changes for {member.name}.</p>
        )}
      </Section>

      <SeriesNav
        previous={previous ? { label: previous.name, href: paths.crewMember(previous.id) } : undefined}
        next={next ? { label: next.name, href: paths.crewMember(next.id) } : undefined}
      />
      <SourceNote />
    </ContentShell>
  );
}
