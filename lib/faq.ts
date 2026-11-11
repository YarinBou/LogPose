/**
 * Frequently asked questions, answered from the site's own data so the answers can never
 * drift from the timeline. Shown on the home page and published as FAQPage structured data.
 */
import { LOCATIONS } from "@/data/map";
import { ALL_ARCS, CREW, SAGAS } from "@/data/timeline";
import { berries, bountyHistory, CREW_ORDER, joinArc, listOf } from "@/lib/content";

export interface FaqEntry {
  question: string;
  answer: string;
}

const joinOrder = CREW_ORDER.map((id) => {
  const arc = joinArc(id);
  return arc ? `${CREW[id].name} (${arc.name})` : CREW[id].name;
});

const luffyBounties = bountyHistory("luffy").map((step) => `${berries(step.amount)} after ${step.arc.name}`);

export const FAQ: FaqEntry[] = [
  {
    question: "In what order do the One Piece arcs happen?",
    answer: `There are ${ALL_ARCS.length} arcs across ${SAGAS.length} sagas. In order: ${listOf(ALL_ARCS.map((arc) => arc.name))}.`,
  },
  {
    question: "What are the One Piece sagas in order?",
    answer: `${listOf(SAGAS.map((saga) => saga.name))}.`,
  },
  {
    question: "What year is it in One Piece?",
    answer:
      "The world counts years on the Sea Circle Calendar (Kaienreki). By the Library of Ohara's reconstruction, the story before the timeskip takes place in the year 1522 and the story after it in 1524. Gol D. Roger was executed in 1500, and Luffy was born on May 5th, 1505.",
  },
  {
    question: "How long is the timeskip in One Piece?",
    answer:
      "Two years. The crew is scattered at the Sabaody Archipelago in April 1522 and reunites there around February 1524. Luffy's message at Marineford, \"3D2Y\", told the crew to meet in two years instead of three days.",
  },
  {
    question: "In what order do the Straw Hat Pirates join the crew?",
    answer: `${listOf(joinOrder)}. Before the timeskip the whole journey from Foosha Village to the Summit War takes only about two to three months of in-world time, from around February to April 1522.`,
  },
  {
    question: "What is Luffy's bounty history?",
    answer: `${listOf(luffyBounties)}. His latest bounty, ${berries(CREW.luffy.bounty)}, was issued when he was named one of the Four Emperors.`,
  },
  {
    question: "How is the One Piece world map laid out?",
    answer: `Two lines cross the globe at right angles. The Red Line is a continent that rings the world through both poles, and the Grand Line is a sea route around the equator with a windless Calm Belt on each side. Together they divide the ocean into the four Blues: North Blue, East Blue, West Blue and South Blue. The first half of the Grand Line is called Paradise and the second half the New World. The lines meet at Reverse Mountain and again at Mary Geoise. This site charts ${LOCATIONS.filter((l) => !l.faction).length} named places from the Library of Ohara's map.`,
  },
  {
    question: "Where is Laugh Tale?",
    answer:
      "Laugh Tale is the last island of the Grand Line and is on no chart. Its position can only be found by reading the four red Road Poneglyphs together. Gol D. Roger's crew reached it in 1499, a year before his execution.",
  },
];
