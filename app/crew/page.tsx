import type { Metadata } from "next";
import { ContentShell, Section, SourceNote, TextLink } from "@/components/content/ContentShell";
import { berries, CREW_LIST, joinArc, listOf, paths } from "@/lib/content";
import { collectionSchema, pageMetadata } from "@/lib/seo";

const TITLE = "Straw Hat Pirates: Crew, Roles and Bounties";
const DESCRIPTION = `All ${CREW_LIST.length} Straw Hat Pirates in the order they joined: ${listOf(CREW_LIST.map((member) => member.name))}. Roles, epithets, birthdays, join dates and current bounties.`;

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: paths.crew, type: "website" });

const totalBounty = CREW_LIST.reduce((sum, member) => sum + member.bounty, 0);

export default function CrewPage() {
  return (
    <ContentShell
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Crew", path: paths.crew },
      ]}
      kicker={`${CREW_LIST.length} members · total bounty ${berries(totalBounty)}`}
      title="The Straw Hat Pirates"
      lead={
        <>
          The crew of Monkey D. Luffy, in the order they came aboard. Bounties are the latest issued, after the raid on
          Onigashima. The crew&apos;s combined bounty is {berries(totalBounty)}.
        </>
      }
      schema={[
        collectionSchema({
          path: paths.crew,
          name: TITLE,
          description: DESCRIPTION,
          items: CREW_LIST.map((member) => ({ name: member.name, path: paths.crewMember(member.id) })),
        }),
      ]}
    >
      <Section title="Members in join order">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-[14.5px]">
            <thead>
              <tr className="border-b border-ink-500/40 text-[11px] uppercase tracking-[0.12em] text-ink-500">
                <th scope="col" className="py-1.5 pr-3 font-semibold">#</th>
                <th scope="col" className="py-1.5 pr-3 font-semibold">Name</th>
                <th scope="col" className="py-1.5 pr-3 font-semibold">Role</th>
                <th scope="col" className="py-1.5 pr-3 font-semibold">Epithet</th>
                <th scope="col" className="py-1.5 pr-3 font-semibold">Joined in</th>
                <th scope="col" className="py-1.5 text-right font-semibold">Bounty (Berries)</th>
              </tr>
            </thead>
            <tbody>
              {CREW_LIST.map((member, index) => {
                const arc = joinArc(member.id);
                return (
                  <tr key={member.id} className="border-b border-ink-500/15 align-top">
                    <td className="py-1.5 pr-3 tabular-nums text-ink-500">{index + 1}</td>
                    <th scope="row" className="py-1.5 pr-3 font-normal">
                      <TextLink href={paths.crewMember(member.id)}>{member.name}</TextLink>
                    </th>
                    <td className="py-1.5 pr-3">{member.role}</td>
                    <td className="py-1.5 pr-3">&ldquo;{member.epithet}&rdquo;</td>
                    <td className="py-1.5 pr-3">{arc ? <TextLink href={paths.arc(arc.id)}>{arc.name}</TextLink> : "-"}</td>
                    <td className="py-1.5 text-right tabular-nums">{berries(member.bounty).replace(" Berries", "")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="When each member joined">
        <ol className="list-decimal space-y-1 pl-5">
          {CREW_LIST.map((member) => {
            const arc = joinArc(member.id);
            return (
              <li key={member.id}>
                <strong>{member.name}</strong>, {member.role.toLowerCase()}
                {arc ? (
                  <>
                    : <TextLink href={paths.arc(arc.id)}>{arc.name}</TextLink>, {arc.dateLabel}
                  </>
                ) : null}
              </li>
            );
          })}
        </ol>
      </Section>
      <SourceNote />
    </ContentShell>
  );
}
