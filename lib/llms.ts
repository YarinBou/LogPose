/**
 * Plain-text versions of the site for language models.
 *
 * /llms.txt is a short guide to what the site is and where things are (the llms.txt
 * convention). /llms-full.txt is the whole dataset as Markdown, so an assistant can read
 * every arc, date, bounty and place in one request instead of crawling a hundred pages.
 * Both are generated from the same data as the pages, so they cannot fall out of date.
 */
import { PONEGLYPHS } from "@/data/map";
import { ALL_ARCS, CREW, SAGAS } from "@/data/timeline";
import {
  arcNumber,
  berries,
  bountyHistory,
  bountyText,
  CREW_LIST,
  joinArc,
  LANDMARKS,
  listOf,
  paths,
  PLACES_BY_REGION,
} from "@/lib/content";
import { FAQ } from "@/lib/faq";
import { absoluteUrl, LAST_UPDATED, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SOURCES } from "@/lib/site";

const TOTAL_PLACES = PLACES_BY_REGION.reduce((sum, group) => sum + group.places.length, 0);

function link(label: string, path: string, note?: string): string {
  return `- [${label}](${absoluteUrl(path)})${note ? `: ${note}` : ""}`;
}

export function llmsIndex(): string {
  return [
    `# ${SITE_NAME}: ${SITE_TITLE}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `${SITE_NAME} is an unofficial fan reference for the manga One Piece by Eiichiro Oda. It covers ${ALL_ARCS.length} story arcs in ${SAGAS.length} sagas, the ${CREW_LIST.length} Straw Hat Pirates with their bounty histories, and ${TOTAL_PLACES} charted places. In-world dates use the Sea Circle Calendar (Kaienreki) as reconstructed by the Library of Ohara: the story before the timeskip is the year 1522, after it 1524. Content last reviewed ${LAST_UPDATED}.`,
    "",
    "## Start here",
    "",
    link("Full dataset as one Markdown file", "/llms-full.txt", "every arc, date, bounty and place"),
    link("All One Piece arcs in order", paths.arcs, "table of arcs with in-world dates, chapters and who joined"),
    link("The Straw Hat Pirates", paths.crew, "members, roles, join order and bounties"),
    link("Locations of the One Piece world", paths.locations, `${TOTAL_PLACES} places grouped by sea`),
    link("Illustrated timeline and 2D world map", "/", "the interactive home page"),
    link("3D world map", paths.map3d, "the world as a globe, with the crew's course"),
    "",
    "## Sagas",
    "",
    ...SAGAS.map((saga) => link(saga.name, paths.saga(saga.id), `${listOf(saga.arcs.map((arc) => arc.name))} (Sea Circle Calendar ${saga.years})`)),
    "",
    "## Arcs",
    "",
    ...ALL_ARCS.map((arc) => link(`${arc.name} Arc`, paths.arc(arc.id), `${arc.dateLabel}; ${arc.chapters}`)),
    "",
    "## Crew",
    "",
    ...CREW_LIST.map((member) => link(member.name, paths.crewMember(member.id), `${member.role}, "${member.epithet}", bounty ${berries(member.bounty)}`)),
    "",
    "## Sources",
    "",
    `- [Library of Ohara: The One Piece Timeline](${SOURCES.timeline})`,
    `- [Library of Ohara: One Piece World Map](${SOURCES.map})`,
    "",
  ].join("\n");
}

export function llmsFull(): string {
  const lines: string[] = [
    `# ${SITE_NAME}: ${SITE_TITLE} (full text)`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `Source: ${absoluteUrl("/")} · Content last reviewed ${LAST_UPDATED} · Unofficial fan reference; One Piece is created by Eiichiro Oda.`,
    "",
    "Dates are in-world dates on the Sea Circle Calendar (Kaienreki), following the Library of Ohara timeline v5.0, which ends at the Egghead Incident. Bounties are in Berries.",
    "",
    "## Frequently asked questions",
    "",
  ];

  for (const entry of FAQ) {
    lines.push(`### ${entry.question}`, "", entry.answer, "");
  }

  lines.push("## Timeline: every arc in order", "");
  for (const saga of SAGAS) {
    lines.push(`### ${saga.name} (Sea Circle Calendar ${saga.years})`, "", saga.tagline, "");
    for (const arc of saga.arcs) {
      lines.push(`#### ${arcNumber(arc)}. ${arc.name} Arc`, "");
      lines.push(`- URL: ${absoluteUrl(paths.arc(arc.id))}`);
      lines.push(`- In-world date: ${arc.dateLabel}`);
      lines.push(`- Manga chapters: ${arc.chapters.replace("Ch. ", "")}`);
      lines.push(`- Setting: ${arc.place}`);
      if (arc.crewJoined.length > 0) lines.push(`- Joined the crew: ${listOf(arc.crewJoined.map((id) => `${CREW[id].name} (${CREW[id].role.toLowerCase()})`))}`);
      if (arc.guests) lines.push(`- Sailing with the crew: ${arc.guests.join(", ")}`);
      lines.push(`- Key character: ${arc.keyCharacter.name}, "${arc.keyCharacter.epithet}", ${arc.keyCharacter.affiliation}. Bounty: ${bountyText(arc)}`);
      if (arc.bountyUpdates) {
        lines.push(`- Bounties issued: ${listOf(arc.bountyUpdates.map((update) => `${CREW[update.crew].name} ${berries(update.amount)}`))}`);
      }
      if (arc.inspiration) lines.push(`- Real-world echo: ${arc.inspiration}`);
      for (const lie of arc.usoppLies ?? []) {
        lines.push(`- Usopp's lie (${lie.fulfilled ? "came true" : "still open"}): ${lie.lie} ${lie.note}`);
      }
      lines.push("", arc.summary, "");
    }
  }

  lines.push("## The Straw Hat Pirates", "");
  CREW_LIST.forEach((member, index) => {
    const arc = joinArc(member.id);
    const history = bountyHistory(member.id);
    lines.push(`### ${index + 1}. ${member.name}`, "");
    lines.push(`- URL: ${absoluteUrl(paths.crewMember(member.id))}`);
    lines.push(`- Role: ${member.role}`);
    lines.push(`- Epithet: "${member.epithet}"`);
    lines.push(`- Birthday: ${member.born}`);
    if (arc) lines.push(`- ${member.id === "luffy" ? "Sets sail" : "Joined"}: ${arc.name} Arc, ${arc.dateLabel}`);
    lines.push(`- Current bounty: ${berries(member.bounty)}`);
    if (history.length > 0) {
      lines.push(`- Bounty history: ${history.map((step) => `${berries(step.amount)} (after ${step.arc.name})`).join("; ")}`);
    }
    lines.push("");
  });

  lines.push(
    "## The world map",
    "",
    "The Red Line is a continent that rings the world through both poles. The Grand Line is a sea route around the equator with a windless Calm Belt on each side. Together they divide the ocean into North Blue, East Blue, West Blue and South Blue. The first half of the Grand Line is Paradise; the second half is the New World. The two lines meet at Reverse Mountain and at Mary Geoise.",
    "",
  );
  for (const group of PLACES_BY_REGION) {
    lines.push(`### ${group.name} (${group.places.length} places)`, "", group.blurb, "", group.places.map((place) => place.name).join(", "), "");
  }

  lines.push("### Landmarks in detail", "");
  for (const location of LANDMARKS) {
    const detail = location.pois.length > 0 ? ` Points of interest: ${location.pois.join(", ")}.` : "";
    lines.push(`- ${location.name} (${absoluteUrl(paths.location(location.id))}): ${location.note}.${detail}`);
  }

  lines.push("", "### Poneglyphs", "");
  for (const stone of PONEGLYPHS) {
    const where = stone.location ? ` Location: ${stone.location}.` : "";
    const reader = stone.readBy ? ` Read by: ${stone.readBy}.` : "";
    lines.push(`- ${stone.name}${stone.road ? " (Road Poneglyph)" : ""}.${where}${reader}`);
  }

  lines.push("", "## Sources", "", `- Library of Ohara, The One Piece Timeline: ${SOURCES.timeline}`, `- Library of Ohara, One Piece World Map: ${SOURCES.map}`, "");
  return lines.join("\n");
}
