/**
 * Extended information for map locations: what each place is, what happened there and
 * who has been there. Keyed by location id (see data/map.ts).
 *
 * Everything here is written for this site, from the manga's canon. Where a chapter or
 * episode number, a ruler or a population was not known with confidence, the field is
 * left out rather than guessed. `spoilerLevel` is the latest manga chapter a reader needs
 * to have reached for the entry to be safe to read.
 *
 * Saga and arc are filled in automatically from data/timeline.ts for places the voyage
 * visits; they are set here only for places seen in flashbacks or outside the main course.
 */
import type { LocationInfo, Visitor } from "@/data/map";

/* ------------------------------------------------------------------ */
/* Helpers for writing visitor lists                                    */
/* ------------------------------------------------------------------ */

const STRAW_HATS = [
  "Monkey D. Luffy",
  "Roronoa Zoro",
  "Nami",
  "Usopp",
  "Sanji",
  "Tony Tony Chopper",
  "Nico Robin",
  "Franky",
  "Brook",
  "Jinbe",
] as const;

/** The first `count` Straw Hats in join order. */
function crew(count: number): Visitor[] {
  return STRAW_HATS.slice(0, count).map((name) => ({ name, kind: "crew" }));
}

function member(...names: (typeof STRAW_HATS)[number][]): Visitor[] {
  return names.map((name) => ({ name, kind: "crew" }));
}

function people(...names: string[]): Visitor[] {
  return names.map((name) => ({ name, kind: "character" }));
}

function groups(...names: string[]): Visitor[] {
  return names.map((name) => ({ name, kind: "organisation" }));
}

function flashback(...names: string[]): Visitor[] {
  return names.map((name) => ({ name, kind: "character", note: "flashback" }));
}

/* ------------------------------------------------------------------ */
/* The entries                                                          */
/* ------------------------------------------------------------------ */

export const LOCATION_INFO: Record<string, LocationInfo> = {
  /* ============================ East Blue ============================ */

  "foosha-village": {
    firstMangaChapter: 1,
    firstAnimeEpisode: 4,
    terrain: "temperate",
    description:
      "A quiet windmill village on the coast of Dawn Island, at the edge of the Goa Kingdom. Luffy grew up here, and for about a year it was the port the Red Hair Pirates kept coming back to.",
    keyEvents: [
      "Shanks and his crew make the village their base",
      "Luffy eats the Gomu Gomu no Mi by accident",
      "Shanks loses his left arm saving Luffy from a Sea King, and leaves him his straw hat",
      "Ten years later Luffy rows out to sea at seventeen",
    ],
    visitedBy: [...crew(1), ...people("Shanks", "Makino", "Woop Slap", "Higuma"), ...flashback("Monkey D. Garp"), ...groups("Red Hair Pirates")],
    ruler: "Mayor Woop Slap",
    affiliation: "Goa Kingdom",
    features: "Windmills; Partys Bar",
    status: "active",
    spoilerLevel: 1,
  },
  "dawn-island": {
    saga: "East Blue Saga",
    terrain: "temperate",
    description:
      "The island in the far north-east of East Blue that holds the Goa Kingdom, Foosha Village, the Gray Terminal and Mt. Colubo. Luffy was raised on the mountain by the bandit Curly Dadan, alongside Ace and Sabo.",
    keyEvents: [
      "Garp leaves Luffy with Curly Dadan's mountain bandits",
      "Luffy, Ace and Sabo swear brotherhood over stolen sake",
      "The nobles of Goa burn the Gray Terminal before a Celestial Dragon's visit",
    ],
    visitedBy: [...crew(1), ...flashback("Portgas D. Ace", "Sabo", "Curly Dadan", "Monkey D. Garp", "Monkey D. Dragon")],
    affiliation: "Goa Kingdom",
    status: "active",
    spoilerLevel: 589,
  },
  "goa-kingdom": {
    saga: "East Blue Saga",
    terrain: "urban",
    description:
      "A walled kingdom on Dawn Island, held up as the cleanest country in East Blue. It keeps that reputation by pushing everything it does not want, people included, out to the Gray Terminal beyond the walls.",
    keyEvents: [
      "Sabo runs away from his noble family",
      "The Gray Terminal is set on fire on the king's orders",
      "Sabo's boat is shot by a Celestial Dragon as he tries to leave",
    ],
    visitedBy: [...flashback("Sabo", "Portgas D. Ace", "Monkey D. Dragon"), ...crew(1)],
    ruler: "King Stelly",
    affiliation: "World Government",
    features: "High Town; Edge Town; the Gray Terminal",
    status: "active",
    spoilerLevel: 823,
  },
  "goat-island": {
    firstMangaChapter: 2,
    terrain: "temperate",
    description:
      "A small island near Dawn Island that the pirate Alvida used as a hideout. Luffy washes up here in a barrel on his first days at sea and meets Koby, her unwilling cabin boy.",
    keyEvents: ["Luffy meets Koby", "Luffy sends Alvida flying and takes a boat", "Koby decides to join the Marines"],
    visitedBy: [...crew(1), ...people("Koby", "Alvida"), ...groups("Alvida Pirates")],
    status: "active",
    spoilerLevel: 2,
  },
  "shells-town": {
    firstMangaChapter: 3,
    firstAnimeEpisode: 2,
    terrain: "urban",
    description:
      "A Marine base town ruled through fear by Captain \"Axe-Hand\" Morgan. The bounty hunter Roronoa Zoro is tied to a post in the base's yard when Luffy arrives looking for his first crewmate.",
    keyEvents: [
      "Zoro is held for a month after protecting a girl from Helmeppo's wolf",
      "Luffy frees Zoro, who joins him as the crew's swordsman",
      "Morgan is beaten and arrested by his own men",
      "Koby and Helmeppo enlist in the Marines",
    ],
    visitedBy: [...crew(2), ...people("Koby", "Helmeppo", "Morgan", "Rika"), ...groups("Marines 153rd Branch")],
    affiliation: "Marines",
    features: "153rd Branch base",
    status: "active",
    spoilerLevel: 7,
  },
  "yotsuba-island": {
    saga: "East Blue Saga",
    terrain: "temperate",
    description: "The East Blue island on which Shells Town and the Marines' 153rd Branch stand.",
    affiliation: "Marines",
    status: "active",
    spoilerLevel: 7,
  },
  sixis: {
    terrain: "tropical",
    description:
      "An uninhabited East Blue island where Portgas D. Ace was stranded soon after setting sail. He ate the Mera Mera no Mi here and left as captain of the newly formed Spade Pirates. The episode is told in the Ace novels, not in the manga itself.",
    keyEvents: ["Ace is shipwrecked at seventeen", "Ace eats the Mera Mera no Mi", "The Spade Pirates are founded"],
    visitedBy: flashback("Portgas D. Ace"),
    status: "active",
    spoilerLevel: 552,
  },
  "shimotsuki-village": {
    saga: "East Blue Saga",
    arc: "Romance Dawn",
    firstMangaChapter: 5,
    firstAnimeEpisode: 19,
    terrain: "temperate",
    description:
      "The East Blue village where Zoro trained as a boy, at the Isshin Dojo of the swordsman Koushirou. The promise he made here is the reason he carries three swords.",
    keyEvents: [
      "Zoro loses 2,001 duels to Kuina, the master's daughter",
      "Kuina dies, and Zoro inherits her sword, Wado Ichimonji",
      "Zoro vows to become the world's greatest swordsman for both of them",
    ],
    visitedBy: [...member("Roronoa Zoro"), ...flashback("Kuina", "Koushirou")],
    features: "Isshin Dojo",
    status: "active",
    spoilerLevel: 5,
  },
  "organ-archipelago": {
    saga: "East Blue Saga",
    arc: "Orange Town",
    terrain: "temperate",
    description: "The island group in central East Blue that holds Orange Town.",
    status: "active",
    spoilerLevel: 8,
  },
  "orange-town": {
    firstMangaChapter: 8,
    terrain: "urban",
    description:
      "A port town emptied by Buggy the Clown, whose crew uses it for cannon practice. Its mayor stays behind, and so does Shushu, a dog still guarding the pet-food shop of a master who will never come back.",
    keyEvents: [
      "Luffy meets Nami, a thief who steals only from pirates",
      "Buggy's crew burns Shushu's shop",
      "Luffy defeats Buggy and scatters his body parts",
      "Nami agrees to sail with Luffy as navigator",
    ],
    visitedBy: [...crew(3), ...people("Buggy", "Mayor Boodle", "Shushu"), ...groups("Buggy Pirates")],
    ruler: "Mayor Boodle",
    status: "active",
    spoilerLevel: 21,
  },
  "rare-animal-island": {
    saga: "East Blue Saga",
    arc: "Orange Town",
    firstMangaChapter: 22,
    firstAnimeEpisode: 18,
    terrain: "tropical",
    description:
      "An island of mismatched animals found nowhere else. Its one human resident, Gaimon, has been stuck in a treasure chest for twenty years while guarding chests on a cliff he could never climb.",
    keyEvents: ["Luffy and Nami meet Gaimon", "The treasure chests turn out to be empty", "Gaimon chooses to stay and protect the animals"],
    visitedBy: [...member("Monkey D. Luffy", "Nami"), ...people("Gaimon")],
    status: "active",
    spoilerLevel: 22,
  },
  "gecko-archipelago": {
    saga: "East Blue Saga",
    arc: "Syrup Village",
    terrain: "temperate",
    description: "The island group in central East Blue that holds Syrup Village, Usopp's home.",
    status: "active",
    spoilerLevel: 23,
  },
  "syrup-village": {
    firstMangaChapter: 23,
    firstAnimeEpisode: 9,
    terrain: "temperate",
    description:
      "Usopp's home village, where he runs through the streets every morning shouting that pirates are coming. Above it stands the mansion of Kaya, whose butler is the retired pirate captain Kuro in hiding.",
    keyEvents: [
      "Usopp overhears Kuro's plan to kill Kaya for her fortune",
      "The Black Cat Pirates land on the north slope",
      "Luffy defeats Kuro",
      "Kaya gives the crew the Going Merry, and Usopp joins as sniper",
    ],
    visitedBy: [...crew(4), ...people("Kaya", "Kuro", "Jango", "Merry"), ...groups("Black Cat Pirates", "Usopp Pirates")],
    status: "active",
    spoilerLevel: 41,
  },
  "mirrorball-island": {
    saga: "East Blue Saga",
    terrain: "urban",
    description:
      "An East Blue island known for its dance hall. In a cover-page story the hypnotist Jango lands here after Syrup Village, wins a dance contest and befriends the Marine Fullbody.",
    visitedBy: people("Jango", "Fullbody"),
    status: "active",
    spoilerLevel: 173,
  },
  "sambas-sea-region": {
    saga: "East Blue Saga",
    arc: "Baratie",
    terrain: "temperate",
    description: "The stretch of south-western East Blue where the sea restaurant Baratie is moored.",
    status: "active",
    spoilerLevel: 43,
  },
  baratie: {
    firstMangaChapter: 43,
    firstAnimeEpisode: 20,
    terrain: "urban",
    description:
      "A restaurant ship shaped like a fish, run by the former pirate \"Red-Leg\" Zeff and staffed by cooks who fight as well as they cook. It feeds anyone who is hungry, including enemies.",
    keyEvents: [
      "Sanji feeds the starving pirate Gin",
      "Mihawk destroys Don Krieg's fleet and defeats Zoro in a single exchange",
      "Luffy defeats Don Krieg",
      "Sanji leaves to find the All Blue, joining as the crew's cook",
    ],
    visitedBy: [...crew(5), ...people("Zeff", "Dracule Mihawk", "Don Krieg", "Gin", "Fullbody"), ...groups("Krieg Pirates")],
    ruler: "Owner Zeff",
    features: "Floating restaurant; fin deck for fighting",
    status: "active",
    spoilerLevel: 68,
  },
  "conomi-archipelago": {
    saga: "East Blue Saga",
    arc: "Arlong Park",
    terrain: "temperate",
    description:
      "Nami's home islands, in north-western East Blue. For eight years the Arlong Pirates ruled them, charging every villager a monthly fee to stay alive.",
    affiliation: "Formerly the Arlong Pirates",
    status: "active",
    spoilerLevel: 95,
  },
  "cocoyasi-village": {
    terrain: "temperate",
    description:
      "The village where Nami was raised by the former Marine Bell-mère, among her tangerine groves. Its people hid their gratitude from Nami for eight years so she would feel free to run.",
    keyEvents: ["Arlong kills Bell-mère", "Nami joins Arlong's crew to buy the village back", "The village rises against Arlong"],
    visitedBy: [...crew(5), ...people("Nojiko", "Genzo"), ...flashback("Bell-mère")],
    status: "active",
    spoilerLevel: 95,
  },
  "gosa-town": {
    terrain: "temperate",
    description: "A town in the Conomi Islands that Arlong wrecked as a warning when it could not pay his fee.",
    status: "destroyed",
    spoilerLevel: 71,
  },
  "arlong-park": {
    firstMangaChapter: 69,
    firstAnimeEpisode: 31,
    terrain: "urban",
    description:
      "The fortress of the fish-man pirate Arlong, built on the coast of the Conomi Islands. From its map room he forced Nami to chart the seas for him for eight years.",
    keyEvents: [
      "A Marine captain in Arlong's pay seizes Nami's savings",
      "Nami asks Luffy for help, and he puts his straw hat on her head",
      "The crew defeats Arlong's officers",
      "Luffy destroys the building with Arlong inside it",
    ],
    visitedBy: [...crew(5), ...people("Arlong", "Hatchan", "Nojiko", "Genzo", "Captain Nezumi"), ...groups("Arlong Pirates")],
    affiliation: "Arlong Pirates",
    status: "destroyed",
    spoilerLevel: 95,
  },
  "pole-star-archipelago": {
    saga: "East Blue Saga",
    arc: "Loguetown",
    terrain: "temperate",
    description: "The island group at the south-western corner of East Blue, nearest the Grand Line. Loguetown is its port.",
    status: "active",
    spoilerLevel: 96,
  },
  loguetown: {
    firstMangaChapter: 96,
    firstAnimeEpisode: 48,
    terrain: "urban",
    description:
      "The last port before the Grand Line, called the town of the beginning and the end: Gol D. Roger was born here and executed here. The Marine captain Smoker keeps it so tightly that no pirate is said to leave.",
    keyEvents: [
      "Zoro is given the cursed sword Sandai Kitetsu and Yubashiri",
      "Buggy and Alvida put Luffy on Roger's execution platform",
      "Lightning destroys the scaffold as Luffy smiles",
      "Dragon stops Smoker, and the crew sets out for the Grand Line",
    ],
    visitedBy: [...crew(5), ...people("Smoker", "Tashigi", "Buggy", "Alvida", "Monkey D. Dragon"), ...flashback("Gol D. Roger")],
    affiliation: "Marines",
    features: "Roger's execution platform",
    status: "active",
    spoilerLevel: 100,
  },
  "tequila-wolf": {
    saga: "Summit War Saga",
    terrain: "snow",
    description:
      "A country that is one enormous bridge, under construction for seven hundred years by prisoners and people from nations that refused to join the World Government. Kuma sends Robin here when the crew is scattered.",
    keyEvents: ["Robin is put to work as a labourer", "The Revolutionary Army frees the workers and takes Robin to Dragon"],
    visitedBy: [...member("Nico Robin"), ...groups("Revolutionary Army")],
    affiliation: "World Government",
    climate: "Snowbound",
    status: "active",
    spoilerLevel: 596,
  },
  "153rd-branch": {
    terrain: "urban",
    description: "The Marine base in Shells Town, commanded by Captain Morgan until Luffy and Zoro brought him down.",
    affiliation: "Marines",
    status: "active",
    spoilerLevel: 7,
  },
  "16th-branch": {
    terrain: "urban",
    description: "The Marine base of Captain Nezumi, who took Arlong's bribes and seized Nami's savings on his behalf.",
    affiliation: "Marines",
    status: "active",
    spoilerLevel: 95,
  },

  /* ============================ North Blue ============================ */

  "spider-miles": {
    saga: "Dressrosa Saga",
    arc: "Dressrosa",
    terrain: "urban",
    description:
      "A North Blue port buried in scrap, where the Donquixote Pirates kept their hideout. A dying ten-year-old Trafalgar Law walked in here strapped with grenades and asked to join.",
    keyEvents: ["Law joins the Donquixote Pirates", "Corazon learns Law's full name and decides to save him"],
    visitedBy: [...flashback("Trafalgar Law", "Donquixote Doflamingo", "Donquixote Rosinante"), ...groups("Donquixote Pirates")],
    status: "active",
    spoilerLevel: 767,
  },
  "minion-island": {
    saga: "Dressrosa Saga",
    arc: "Dressrosa",
    terrain: "snow",
    description:
      "A snowbound North Blue island where a deal for the Ope Ope no Mi was to take place. Corazon stole the fruit here for Law, and it cost him his life.",
    keyEvents: [
      "Corazon takes the Ope Ope no Mi from the Barrels Pirates",
      "Law eats the fruit",
      "Doflamingo shoots his brother Corazon",
      "Law escapes, hidden by Corazon's last silence",
    ],
    visitedBy: [...flashback("Trafalgar Law", "Donquixote Rosinante", "Donquixote Doflamingo", "Vergo"), ...groups("Barrels Pirates", "Donquixote Pirates")],
    climate: "Snowbound",
    status: "active",
    spoilerLevel: 767,
  },
  "swallow-island": {
    saga: "Dressrosa Saga",
    arc: "Dressrosa",
    terrain: "snow",
    description: "The island next to Minion Island, where Corazon told Law to wait for him once the Ope Ope no Mi had been stolen.",
    visitedBy: flashback("Trafalgar Law"),
    status: "active",
    spoilerLevel: 767,
  },
  "germa-empire": {
    saga: "Four Emperors Saga",
    arc: "Whole Cake Island",
    terrain: "temperate",
    description:
      "The lands in North Blue that the Vinsmoke family once ruled. Their empire lasted sixty-six days before it fell, which is where the name Germa 66 comes from; the family has wanted it back ever since.",
    affiliation: "Formerly the Vinsmoke family",
    status: "unknown",
    spoilerLevel: 840,
  },
  flevance: {
    saga: "Dressrosa Saga",
    arc: "Dressrosa",
    firstMangaChapter: 762,
    terrain: "snow",
    description:
      "The White City, a wealthy North Blue kingdom built on a snow-white ore called Amber Lead. The ore was poisonous, the government had known for a century, and when the sickness appeared its neighbours sealed the borders and burned the country.",
    keyEvents: [
      "Amber Lead poisoning shows up across a whole generation",
      "Neighbouring kingdoms quarantine the city and open fire",
      "Law escapes hidden among the dead, the only survivor",
    ],
    visitedBy: flashback("Trafalgar Law"),
    affiliation: "World Government",
    features: "Amber Lead mines",
    status: "destroyed",
    spoilerLevel: 762,
  },
  "lvneel-kingdom": {
    saga: "Sky Island Saga",
    arc: "Jaya",
    terrain: "temperate",
    description:
      "The North Blue kingdom that Mont Blanc Noland sailed from four hundred years ago. Its king executed him as a liar when the city of gold he reported could not be found, and the story became a children's tale across the North Blue.",
    keyEvents: ["Noland sets out on his voyage of exploration", "Noland is executed after Jaya's golden city is found missing"],
    visitedBy: flashback("Mont Blanc Noland"),
    status: "active",
    spoilerLevel: 292,
  },

  /* ============================ West Blue ============================ */

  ohara: {
    saga: "Water 7 Saga",
    arc: "Enies Lobby",
    firstMangaChapter: 391,
    firstAnimeEpisode: 275,
    terrain: "temperate",
    description:
      "An island of scholars in West Blue, home to the Tree of Omniscience and the largest library in the world. Its archaeologists studied the Poneglyphs in secret, and the World Government erased the island with a Buster Call for it.",
    keyEvents: [
      "Robin passes the scholars' exam at the age of eight",
      "Professor Clover is shot before he can name the ancient kingdom",
      "The Buster Call burns the island and everyone on it",
      "The giant Saul is frozen by Vice Admiral Kuzan after getting Robin to the shore",
    ],
    visitedBy: [...member("Nico Robin"), ...flashback("Nico Olvia", "Professor Clover", "Jaguar D. Saul", "Kuzan", "Spandine")],
    features: "Tree of Omniscience",
    status: "destroyed",
    spoilerLevel: 398,
  },
  "god-valley": {
    saga: "Final Saga",
    arc: "Egghead",
    terrain: "temperate",
    description:
      "A West Blue island that no longer appears on any chart. Thirty-eight years ago the Rocks Pirates were broken here, by Gol D. Roger and the Marine Monkey D. Garp fighting side by side.",
    keyEvents: [
      "The Rocks Pirates are defeated",
      "Garp earns the name \"Hero of the Marines\"",
      "The island itself disappears afterwards",
    ],
    visitedBy: [...flashback("Gol D. Roger", "Monkey D. Garp", "Rocks D. Xebec", "Bartholomew Kuma", "Emporio Ivankov"), ...groups("Rocks Pirates", "Roger Pirates")],
    status: "destroyed",
    spoilerLevel: 1096,
  },
  "kano-country": {
    saga: "Dressrosa Saga",
    arc: "Dressrosa",
    terrain: "temperate",
    description:
      "A West Blue country and home of the Happo Navy, the fleet once led by Don Chinjao and now by his grandson Sai.",
    visitedBy: [...people("Don Chinjao", "Sai", "Boo"), ...groups("Happo Navy")],
    status: "active",
    spoilerLevel: 801,
  },

  /* ============================ South Blue ============================ */

  baterilla: {
    saga: "Summit War Saga",
    arc: "Marineford",
    terrain: "tropical",
    description:
      "The South Blue island where Portgas D. Rouge hid from the Marines searching for Roger's child. She carried Ace for twenty months to keep him from being found, and died giving birth to him.",
    keyEvents: ["The Marines search the island for any child of Gol D. Roger", "Ace is born, and Garp takes him to Dawn Island"],
    visitedBy: flashback("Portgas D. Rouge", "Portgas D. Ace", "Monkey D. Garp"),
    status: "active",
    spoilerLevel: 551,
  },
  "sorbet-kingdom": {
    saga: "Final Saga",
    arc: "Egghead",
    terrain: "temperate",
    description:
      "A poor South Blue kingdom, and the home Bartholomew Kuma chose. He drove out a tyrant king here and was made king himself, before he gave up everything for his daughter Bonney.",
    keyEvents: ["Kuma overthrows King Bekori", "Kuma leaves the kingdom to save Bonney", "Bonney is raised in the church by the kingdom's people"],
    visitedBy: flashback("Bartholomew Kuma", "Jewelry Bonney", "Ginny"),
    ruler: "Formerly Bartholomew Kuma",
    status: "active",
    spoilerLevel: 1101,
  },
  "torino-kingdom": {
    saga: "Summit War Saga",
    terrain: "tropical",
    description:
      "A South Blue island where giant birds and a tribe of people have fought over the same medicinal tree for generations. Chopper lands here when the crew is scattered and spends two years studying its library of remedies.",
    keyEvents: ["Chopper ends the feud between the birds and the islanders", "Chopper trains here for two years"],
    visitedBy: member("Tony Tony Chopper"),
    features: "Treasure Tree of medicinal plants",
    status: "active",
    spoilerLevel: 597,
  },

  /* ============================ Red Line ============================ */

  "reverse-mountain": {
    firstMangaChapter: 101,
    firstAnimeEpisode: 61,
    terrain: "redline",
    description:
      "The one mountain on the Red Line that ships can cross. Currents from all four Blues run up its slopes, meet at the summit and pour down a single channel into the Grand Line.",
    keyEvents: ["The Going Merry rides the current up and over", "The crew crashes into Laboon at the foot of the mountain"],
    visitedBy: [...crew(5), ...people("Laboon", "Crocus")],
    features: "Four ascending currents and one descending canal",
    status: "active",
    spoilerLevel: 105,
  },
  "holyland-mary-geoise": {
    terrain: "redline",
    description:
      "The capital of the World Government, on top of the Red Line. The Celestial Dragons live here, the kings of the world meet here for the Reverie, and at its centre is an Empty Throne that no single ruler is supposed to sit on.",
    keyEvents: [
      "Fisher Tiger climbs the Red Line and frees the slaves",
      "The Reverie votes to abolish the Seven Warlords",
      "King Cobra of Alabasta is killed, and Sabo is blamed",
    ],
    visitedBy: [
      ...people("Nefertari Vivi", "Nefertari Cobra", "Sabo", "Shirahoshi", "Rob Lucci", "Bartholomew Kuma"),
      ...flashback("Fisher Tiger"),
      ...groups("Celestial Dragons", "Five Elders", "Revolutionary Army"),
    ],
    ruler: "The Five Elders",
    affiliation: "World Government",
    features: "Pangaea Castle; the Empty Throne",
    status: "active",
    spoilerLevel: 1085,
  },
  "fish-man-island": {
    firstMangaChapter: 608,
    firstAnimeEpisode: 527,
    terrain: "bubble",
    description:
      "The home of the fish-men and merfolk, ten thousand metres under the sea in a hole through the Red Line. Light reaches it through the roots of the tree Eve, and it is the only way from Paradise to the New World that does not cross Mary Geoise.",
    keyEvents: [
      "Hody Jones and the New Fish-Man Pirates attempt a coup",
      "Luffy knocks out fifty thousand of Hody's men at once",
      "Princess Shirahoshi's power over Sea Kings awakens",
      "Luffy declares war on Big Mom over the island's candy",
    ],
    visitedBy: [
      ...crew(9),
      ...member("Jinbe"),
      ...people("Shirahoshi", "King Neptune", "Hody Jones", "Vander Decken IX", "Camie", "Caribou"),
      ...groups("New Fish-Man Pirates", "Sun Pirates"),
    ],
    ruler: "King Neptune",
    affiliation: "World Government",
    population: "About 5,000,000",
    features: "Sunlight Tree Eve; Ryugu Palace; the Sea Forest",
    status: "active",
    spoilerLevel: 653,
  },
  "ryugu-kingdom": {
    terrain: "bubble",
    description: "The kingdom of Fish-Man Island, ruled from Ryugu Palace by King Neptune and his family.",
    ruler: "King Neptune",
    affiliation: "World Government",
    status: "active",
    spoilerLevel: 653,
  },
  "sun-tree-eve": {
    saga: "Fish-Man Island Saga",
    arc: "Fish-Man Island",
    terrain: "redline",
    description:
      "A giant tree on the Red Line whose roots reach down to the sea floor. They carry sunlight and air to Fish-Man Island, ten thousand metres below.",
    status: "active",
    spoilerLevel: 612,
  },

  /* ============================ Calm Belt ============================ */

  rusukaina: {
    saga: "Summit War Saga",
    arc: "Post-War and 3D2Y",
    firstMangaChapter: 597,
    firstAnimeEpisode: 516,
    terrain: "tropical",
    description:
      "An uninhabited island in the Calm Belt, north-west of Amazon Lily, with forty-eight seasons a year and beasts strong enough to have wiped out the kingdom that once stood here. Rayleigh picks it as Luffy's training ground.",
    keyEvents: ["Rayleigh teaches Luffy the three kinds of Haki", "Luffy trains here alone for the second year of the timeskip"],
    visitedBy: [...member("Monkey D. Luffy"), ...people("Silvers Rayleigh", "Boa Hancock")],
    climate: "Forty-eight seasons, changing weekly",
    status: "active",
    spoilerLevel: 597,
  },
  "island-of-women": {
    firstMangaChapter: 514,
    firstAnimeEpisode: 408,
    terrain: "tropical",
    description:
      "Amazon Lily, the island of the Kuja tribe, deep in the Calm Belt. Only women are born here, men are forbidden to land, and strength is counted as beauty. It is ruled by the Pirate Empress, Boa Hancock.",
    keyEvents: [
      "Kuma sends Luffy here when the crew is scattered",
      "Luffy shields the Gorgon sisters' slave marks from the crowd",
      "Hancock agrees to take Luffy to Impel Down",
      "Luffy recovers here after the Summit War",
    ],
    visitedBy: [...member("Monkey D. Luffy"), ...people("Boa Hancock", "Marguerite", "Elder Nyon", "Silvers Rayleigh", "Trafalgar Law", "Jinbe"), ...groups("Kuja Pirates")],
    ruler: "Boa Hancock",
    affiliation: "Kuja Pirates",
    status: "active",
    spoilerLevel: 599,
  },
  "amazon-lily-empire": {
    terrain: "tropical",
    description: "The nation of the Kuja tribe on the Island of Women, ruled by the empress Boa Hancock.",
    ruler: "Boa Hancock",
    status: "active",
    spoilerLevel: 524,
  },
  "impel-down": {
    firstMangaChapter: 525,
    firstAnimeEpisode: 422,
    terrain: "fortress",
    description:
      "The World Government's undersea prison, in the Calm Belt. Each level down is a worse hell than the last, and the sixth holds prisoners whose crimes were erased from the record. Nobody had ever broken in before Luffy.",
    keyEvents: [
      "Luffy infiltrates the prison to reach Ace",
      "Magellan poisons Luffy, and Ivankov revives him",
      "Ace is moved to Marineford before Luffy reaches Level 6",
      "The largest breakout in the prison's history; Mr. 2 stays behind to hold the gate",
    ],
    visitedBy: [
      ...member("Monkey D. Luffy"),
      ...people("Portgas D. Ace", "Jinbe", "Crocodile", "Emporio Ivankov", "Bon Clay", "Buggy", "Magellan", "Marshall D. Teach"),
      ...groups("Blackbeard Pirates"),
    ],
    ruler: "Chief Warden Magellan",
    affiliation: "World Government",
    features: "Six levels, plus the hidden Level 5.5",
    status: "active",
    spoilerLevel: 549,
  },

  /* ============================ Paradise ============================ */

  "twin-capes": {
    saga: "Alabasta Saga",
    arc: "Reverse Mountain",
    firstMangaChapter: 102,
    firstAnimeEpisode: 62,
    terrain: "rock",
    description:
      "The two headlands at the foot of Reverse Mountain, where the Grand Line begins. The lighthouse keeper Crocus lives here and looks after Laboon, a whale waiting fifty years for a pirate crew to return.",
    keyEvents: ["Luffy fights Laboon and paints the crew's mark on his head as a promise", "Crocus explains the Log Pose", "Mr. 9 and Miss Wednesday ask for passage to Whisky Peak"],
    visitedBy: [...crew(5), ...people("Crocus", "Laboon", "Nefertari Vivi", "Mr. 9")],
    features: "Lighthouse",
    status: "active",
    spoilerLevel: 105,
  },
  "cactus-island": {
    saga: "Alabasta Saga",
    arc: "Whisky Peak",
    terrain: "desert",
    description: "An island of giant cactus-shaped rocks near the start of the Grand Line. The town of Whisky Peak sits among them.",
    features: "The \"cactus spines\" are grave markers",
    status: "active",
    spoilerLevel: 114,
  },
  "whisky-peak": {
    firstMangaChapter: 106,
    firstAnimeEpisode: 64,
    terrain: "desert",
    description:
      "A town that throws a feast for every pirate crew that arrives, then robs them once they are asleep. All of its townsfolk are bounty hunters working for Baroque Works.",
    keyEvents: [
      "Zoro defeats a hundred bounty hunters alone",
      "Miss Wednesday is exposed as Princess Vivi of Alabasta",
      "Crocodile is named as the head of Baroque Works",
      "The crew agrees to take Vivi home",
    ],
    visitedBy: [...crew(5), ...people("Nefertari Vivi", "Igaram", "Mr. 5", "Miss Valentine", "Nico Robin"), ...groups("Baroque Works")],
    affiliation: "Baroque Works",
    status: "active",
    spoilerLevel: 114,
  },
  "giant-island-little-garden": {
    firstMangaChapter: 115,
    firstAnimeEpisode: 70,
    terrain: "jungle",
    description:
      "An island that never left the age of dinosaurs. Two giants of Elbaf, Dorry and Brogy, have been duelling here for a hundred years, every time the volcano erupts, over a quarrel neither of them remembers.",
    keyEvents: [
      "Mr. 3 rigs the giants' duel and traps the crew in wax",
      "Usopp and Karoo burn the trap down",
      "Nami is bitten by an insect and falls ill",
      "Dorry and Brogy cut a path through the Island Eater goldfish",
    ],
    visitedBy: [...crew(5), ...people("Nefertari Vivi", "Dorry", "Brogy", "Mr. 3", "Miss Goldenweek", "Mr. 5", "Miss Valentine"), ...groups("Baroque Works")],
    climate: "Prehistoric jungle",
    features: "Two volcanoes; dinosaurs",
    status: "active",
    spoilerLevel: 129,
  },
  "drum-island": {
    firstMangaChapter: 132,
    terrain: "snow",
    description:
      "A winter island of sheer drum-shaped mountains. Its king Wapol exiled every doctor but his own, so when Nami needs treatment the only choice is the 139-year-old Dr. Kureha, in the castle on the highest peak.",
    keyEvents: [
      "Luffy climbs the Drum Rockies bare-handed with Nami on his back",
      "Wapol returns and is knocked out of his own country",
      "Dr. Hiriluk's cherry blossoms bloom over the snow",
      "Chopper joins the crew as its doctor",
    ],
    visitedBy: [...crew(6), ...people("Nefertari Vivi", "Dr. Kureha", "Dalton", "Wapol"), ...flashback("Dr. Hiriluk", "Marshall D. Teach")],
    ruler: "King Dalton (formerly Wapol)",
    climate: "Winter island",
    features: "Drum Rockies; ropeway to the castle",
    status: "active",
    spoilerLevel: 154,
  },
  "sakura-kingdom": {
    saga: "Alabasta Saga",
    arc: "Drum Island",
    terrain: "snow",
    description: "The name the Drum Kingdom took after Wapol was driven out, with Dalton chosen as king. It is named for Hiriluk's cherry blossoms.",
    ruler: "King Dalton",
    affiliation: "World Government",
    status: "active",
    spoilerLevel: 440,
  },
  "sandy-island": {
    saga: "Alabasta Saga",
    arc: "Alabasta",
    terrain: "desert",
    description: "The great desert island on which the Alabasta Kingdom lies, crossed by the Sandora River.",
    climate: "Summer island; desert",
    status: "active",
    spoilerLevel: 217,
  },
  "alabasta-kingdom": {
    terrain: "desert",
    description:
      "An ancient desert kingdom on Sandy Island, ruled by the Nefertari family for longer than its records go back. The Warlord Crocodile spent years stealing its rain to start a civil war and take the throne.",
    keyEvents: [
      "The crew crosses the desert with Vivi to stop the rebellion",
      "Crocodile defeats Luffy twice, at Rainbase and at the palace",
      "Luffy beats Crocodile under the royal tomb, and rain falls on Alubarna",
      "The crew raises their marked arms to Vivi as they leave",
      "Nico Robin stows away and joins the crew",
    ],
    visitedBy: [
      ...crew(6),
      ...member("Nico Robin"),
      ...people("Nefertari Vivi", "Nefertari Cobra", "Crocodile", "Portgas D. Ace", "Koza", "Pell", "Chaka", "Smoker", "Tashigi", "Bon Clay"),
      ...groups("Baroque Works", "Rebel Army"),
    ],
    ruler: "Nefertari family",
    affiliation: "World Government",
    climate: "Summer island; desert",
    features: "Alubarna; Rainbase; the Poneglyph in the Tomb of Kings",
    status: "active",
    spoilerLevel: 217,
  },
  "mock-town": {
    saga: "Sky Island Saga",
    arc: "Jaya",
    firstMangaChapter: 222,
    firstAnimeEpisode: 146,
    terrain: "urban",
    description:
      "A lawless port on the west coast of Jaya where pirates spend what they have stolen. It laughs at anyone who talks about dreams, which is why Luffy and Zoro take a beating there without raising a hand.",
    keyEvents: ["Bellamy beats Luffy and Zoro, who refuse to fight back", "Blackbeard tells Luffy that people's dreams never end", "Luffy returns and flattens Bellamy with one punch"],
    visitedBy: [...member("Monkey D. Luffy", "Roronoa Zoro", "Nami"), ...people("Bellamy", "Marshall D. Teach", "Sarquiss"), ...groups("Bellamy Pirates", "Blackbeard Pirates")],
    status: "active",
    spoilerLevel: 236,
  },
  "jaya-island": {
    firstMangaChapter: 222,
    terrain: "jungle",
    description:
      "An island shaped like a skull with half of it missing. The missing half, with the golden city of Shandora on it, was blown into the sky by a Knock-Up Stream four hundred years ago.",
    keyEvents: [
      "The crew meets Mont Blanc Cricket, descendant of Noland the Liar",
      "Luffy catches a South Bird to point the way",
      "The Going Merry rides the Knock-Up Stream into the sky",
    ],
    visitedBy: [...crew(7), ...people("Mont Blanc Cricket", "Masira", "Shoujou", "Bellamy", "Marshall D. Teach")],
    climate: "Spring island",
    status: "active",
    spoilerLevel: 236,
  },
  "sky-sea": {
    saga: "Sky Island Saga",
    arc: "Skypiea",
    firstMangaChapter: 237,
    firstAnimeEpisode: 153,
    terrain: "sky",
    description:
      "The White Sea: an ocean of cloud seven thousand metres above the Blue Sea, with the White-White Sea three thousand metres higher still. Ships sail it, but the air is thin and nothing that falls through comes back.",
    visitedBy: [...crew(7), ...people("Gan Fall")],
    status: "active",
    spoilerLevel: 238,
  },
  "godland-skypiea": {
    firstMangaChapter: 239,
    firstAnimeEpisode: 154,
    terrain: "sky",
    description:
      "A country in the clouds, ten thousand metres up. Its people live on Angel Island, beside the Upper Yard: the half of Jaya that landed here four hundred years ago and that the Shandia have been fighting to take back ever since. When the crew arrives it is ruled by the self-declared god Enel.",
    keyEvents: [
      "The crew is judged guilty of illegal entry and hunted by Enel's priests",
      "Robin finds the ruins of Shandora and reads its Poneglyph",
      "Luffy, immune to lightning, defeats Enel",
      "Luffy rings the Golden Bell so Cricket can hear it from Jaya",
      "Enel leaves for the moon aboard the Ark Maxim",
    ],
    visitedBy: [...crew(7), ...people("Enel", "Gan Fall", "Wyper", "Conis", "Pagaya", "Aisa"), ...flashback("Mont Blanc Noland", "Kalgara", "Gol D. Roger"), ...groups("Shandia")],
    ruler: "Gan Fall (after Enel)",
    features: "Upper Yard; the Golden Bell; Giant Jack; dials",
    status: "active",
    spoilerLevel: 302,
  },
  "long-ring-long-land": {
    firstMangaChapter: 304,
    firstAnimeEpisode: 207,
    terrain: "temperate",
    description:
      "A ring of ten grassy islands that join into one for a few hours each year when the tide drops. Everything that lives here is stretched long, from the horses to the trees.",
    keyEvents: [
      "The Foxy Pirates challenge the crew to a Davy Back Fight",
      "Luffy beats Foxy in the final round and takes only their flag",
      "Admiral Aokiji appears, freezes Robin and Luffy, and lets them live",
    ],
    visitedBy: [...crew(7), ...people("Foxy", "Tonjit", "Kuzan"), ...groups("Foxy Pirates")],
    status: "active",
    spoilerLevel: 321,
  },
  "water-seven": {
    firstMangaChapter: 323,
    firstAnimeEpisode: 229,
    terrain: "city",
    description:
      "The city of water: a shipbuilding metropolis of canals built up the sides of a giant fountain. It sinks a little every year, and its shipwrights at the Galley-La Company are the best in the world.",
    keyEvents: [
      "The Going Merry is judged beyond repair",
      "Usopp duels Luffy and leaves the crew",
      "CP9 agents hidden in Galley-La attack Mayor Iceburg and take Robin",
      "Franky builds the Thousand Sunny and joins the crew",
      "Garp reveals that Luffy's father is the revolutionary Dragon",
    ],
    visitedBy: [
      ...crew(8),
      ...people("Iceburg", "Paulie", "Rob Lucci", "Kaku", "Kalifa", "Blueno", "Kokoro", "Monkey D. Garp", "Koby"),
      ...flashback("Tom"),
      ...groups("Galley-La Company", "Franky Family", "CP9"),
    ],
    ruler: "Mayor Iceburg",
    affiliation: "World Government",
    features: "Seven docks; the Sea Train; Aqua Laguna tidal wave each year",
    status: "active",
    spoilerLevel: 441,
  },
  "shipbuilding-island": {
    terrain: "city",
    description: "The island on which the city of Water Seven is built.",
    status: "active",
    spoilerLevel: 323,
  },
  "shift-station": {
    terrain: "city",
    description: "A Sea Train station on open water between Water Seven and its neighbouring islands, kept by Kokoro and her granddaughter Chimney.",
    visitedBy: people("Kokoro", "Chimney"),
    status: "active",
    spoilerLevel: 322,
  },
  "enies-lobby": {
    terrain: "fortress",
    description:
      "The World Government's judicial island, where it is always day and no accused has ever been found innocent. It stands over a waterfall with no bottom, and beyond its Gate of Justice lie Impel Down and Marine Headquarters.",
    keyEvents: [
      "The crew and the Franky Family storm the island for Robin",
      "Luffy has the World Government's flag shot down as a declaration of war",
      "Robin says she wants to live",
      "Luffy defeats Rob Lucci",
      "A Buster Call levels the island, and the Going Merry carries the crew out",
    ],
    visitedBy: [
      ...crew(8),
      ...people("Rob Lucci", "Kaku", "Jabra", "Kalifa", "Blueno", "Kumadori", "Fukurou", "Spandam", "Paulie", "Kokoro"),
      ...groups("CP9", "Franky Family", "Galley-La Company", "Marines"),
    ],
    affiliation: "World Government",
    features: "Courthouse; Tower of Justice; Gate of Justice; 10,000 soldiers",
    status: "destroyed",
    spoilerLevel: 430,
  },
  "florian-triangle": {
    saga: "Thriller Bark Saga",
    arc: "Thriller Bark",
    terrain: "rock",
    description:
      "A stretch of sea wrapped in fog so thick it is always night. Ships vanish in it every year, and something enormous moves in the mist behind Thriller Bark.",
    visitedBy: [...crew(9), ...people("Gecko Moria")],
    status: "active",
    spoilerLevel: 490,
  },
  "thriller-bark": {
    firstMangaChapter: 443,
    terrain: "haunted",
    description:
      "The largest ship in the world: an entire island, taken from West Blue and turned into a pirate vessel by the Warlord Gecko Moria. He fills it with zombies animated by the stolen shadows of people who wander in.",
    keyEvents: [
      "The crew meets Brook, a living skeleton whose shadow was taken",
      "Moria puts Luffy's shadow into the giant corpse Oars",
      "Luffy defeats Moria at dawn and the shadows return",
      "Zoro takes all of Luffy's pain from Kuma: \"Nothing happened\"",
      "Brook joins the crew as its musician",
    ],
    visitedBy: [
      ...crew(9),
      ...people("Gecko Moria", "Perona", "Dr. Hogback", "Absalom", "Bartholomew Kuma", "Lola"),
      ...groups("Thriller Bark Pirates", "Rolling Pirates"),
    ],
    ruler: "Gecko Moria",
    affiliation: "Thriller Bark Pirates",
    status: "active",
    spoilerLevel: 489,
  },
  "sabaody-archipelago": {
    firstMangaChapter: 496,
    terrain: "mangrove",
    description:
      "A forest of seventy-nine giant mangroves at the foot of the Red Line, each one counted as a numbered grove. Their resin makes the bubbles that coat ships for the dive to Fish-Man Island, so every crew bound for the New World stops here.",
    keyEvents: [
      "Eleven Supernovas arrive at the same time",
      "Luffy punches a Celestial Dragon at the slave auction",
      "Kizaru, Kuma and the Pacifistas defeat the crew, and Kuma scatters them",
      "The crew reunites two years later and sets off under the sea",
    ],
    visitedBy: [
      ...crew(9),
      ...people("Silvers Rayleigh", "Shakky", "Hatchan", "Camie", "Trafalgar Law", "Eustass Kid", "Bartholomew Kuma", "Borsalino", "Sentomaru", "Duval"),
      ...groups("Celestial Dragons", "Marines"),
    ],
    affiliation: "World Government",
    features: "79 groves; bubble coating; Sabaody Park; the Human Auction House",
    status: "active",
    spoilerLevel: 602,
  },
  marineford: {
    terrain: "fortress",
    description:
      "The crescent-shaped island that was Marine Headquarters. The war over Ace's execution was fought in its bay, and it ended an era. Afterwards the headquarters moved to the New World and Marineford became the G-1 base.",
    keyEvents: [
      "Whitebeard's fleet surfaces inside the bay",
      "Luffy and the Impel Down escapees fall from the sky",
      "Ace is freed, then killed by Akainu protecting Luffy",
      "Blackbeard kills Whitebeard and takes his Devil Fruit",
      "Shanks arrives and ends the war",
    ],
    visitedBy: [
      ...member("Monkey D. Luffy"),
      ...people("Edward Newgate", "Portgas D. Ace", "Sengoku", "Monkey D. Garp", "Sakazuki", "Kuzan", "Borsalino", "Marshall D. Teach", "Shanks", "Jinbe", "Trafalgar Law", "Koby"),
      ...groups("Whitebeard Pirates", "Marines", "Seven Warlords", "Blackbeard Pirates"),
    ],
    affiliation: "Marines",
    features: "Oris Plaza; execution platform; the Ox Bell",
    status: "active",
    spoilerLevel: 597,
  },
  "kuraigana-island": {
    saga: "Summit War Saga",
    terrain: "haunted",
    description:
      "A gloomy island of ruins and armed baboons, home of the swordsman Dracule Mihawk. The Shikkearu Kingdom that once stood here destroyed itself in a war. Zoro lands here when the crew is scattered.",
    keyEvents: ["Zoro bows to Mihawk and asks to be trained", "Zoro trains here for two years, with Perona as an unwilling housemate"],
    visitedBy: [...member("Roronoa Zoro"), ...people("Dracule Mihawk", "Perona")],
    features: "Humandrills: baboons that copy human sword styles",
    status: "active",
    spoilerLevel: 597,
  },
  "shikkeahr-kingdom": {
    terrain: "haunted",
    description: "The ruined kingdom on Kuraigana Island. Its people died in a war, and the island's baboons learned to fight by watching them.",
    status: "destroyed",
    spoilerLevel: 597,
  },
  "boin-island-chain": {
    saga: "Summit War Saga",
    terrain: "jungle",
    description:
      "An island chain that is really one colossal carnivorous plant, which lures prey in with food and closes when it is fat enough. Usopp lands here when the crew is scattered and trains under the warrior Heracles.",
    keyEvents: ["Usopp eats himself round", "Usopp learns to fight with the island's Pop Greens"],
    visitedBy: [...member("Usopp"), ...people("Heracles")],
    features: "Greenstone forest; Pop Greens",
    status: "active",
    spoilerLevel: 597,
  },
  "karakuri-island": {
    saga: "Summit War Saga",
    terrain: "snow",
    description:
      "A winter island of mechanised animals and the birthplace of Dr. Vegapunk. Franky lands here when the crew is scattered and spends two years rebuilding himself in the doctor's old laboratory.",
    keyEvents: ["Franky finds Vegapunk's childhood laboratory", "Franky presses the self-destruct switch by mistake"],
    visitedBy: member("Franky"),
    climate: "Winter island",
    features: "Baldimore, the Future Country; Vegapunk's laboratory",
    status: "active",
    spoilerLevel: 597,
  },
  "bulgemore-futuredom": {
    terrain: "snow",
    description: "The \"Future Country\" on Karakuri Island, where the young Vegapunk built machines to keep his neighbours warm.",
    status: "active",
    spoilerLevel: 597,
  },
  weatheria: {
    saga: "Summit War Saga",
    terrain: "sky",
    description:
      "A small sky island run by elderly scholars who study the weather and can tie it into knots. Nami lands here when the crew is scattered and spends two years learning their science.",
    visitedBy: [...member("Nami"), ...people("Haredas")],
    features: "Weather Balls",
    status: "active",
    spoilerLevel: 597,
  },
  "momoiro-island": {
    saga: "Summit War Saga",
    terrain: "tropical",
    description:
      "A pink island that is home to the Kamabakka Kingdom, ruled by the revolutionary Emporio Ivankov. Sanji lands here when the crew is scattered and has to win his recipes by beating its masters of Newkama Kenpo.",
    visitedBy: [...member("Sanji"), ...people("Emporio Ivankov")],
    ruler: "Emporio Ivankov",
    status: "active",
    spoilerLevel: 597,
  },
  "kamabakka-kingdom": {
    terrain: "tropical",
    description: "Ivankov's kingdom on Momoiro Island. After Baltigo fell it became the Revolutionary Army's headquarters.",
    ruler: "Emporio Ivankov",
    affiliation: "Revolutionary Army",
    status: "active",
    spoilerLevel: 904,
  },
  namakura: {
    saga: "Summit War Saga",
    terrain: "haunted",
    description:
      "A poor, superstitious island where Brook lands when the crew is scattered. The villagers of Harahettania take the skeleton for the demon they were trying to summon.",
    visitedBy: member("Brook"),
    status: "active",
    spoilerLevel: 597,
  },
  harahettania: {
    terrain: "haunted",
    description: "The starving kingdom on Namakura Island whose people worship Brook as a demon lord.",
    status: "active",
    spoilerLevel: 597,
  },
  "kenzan-island": {
    terrain: "rock",
    description: "The island of the Longarm tribe. They capture Brook from Namakura and put him on show, which is how the \"Soul King\" begins his world tour.",
    visitedBy: member("Brook"),
    status: "active",
    spoilerLevel: 597,
  },
  "banaro-island": {
    saga: "Water 7 Saga",
    arc: "Post-Enies Lobby",
    terrain: "rock",
    description:
      "A small Grand Line island where Ace finally caught up with Blackbeard. Their duel wrecked the town, and Ace's defeat here is the event that led to the Summit War.",
    keyEvents: ["Blackbeard asks Ace to join him and is refused", "Ace is defeated and handed to the World Government"],
    visitedBy: [...people("Portgas D. Ace", "Marshall D. Teach"), ...groups("Blackbeard Pirates")],
    status: "unknown",
    spoilerLevel: 441,
  },
  baltigo: {
    saga: "Four Emperors Saga",
    terrain: "rock",
    description:
      "An island of white earth that hid the Revolutionary Army's headquarters for years. Its location was discovered, and the Blackbeard Pirates destroyed the base.",
    keyEvents: ["Robin spends two years here with the revolutionaries", "The base is found and destroyed"],
    visitedBy: [...member("Nico Robin"), ...people("Monkey D. Dragon", "Sabo", "Koala"), ...groups("Revolutionary Army", "Blackbeard Pirates")],
    affiliation: "Formerly the Revolutionary Army",
    status: "destroyed",
    spoilerLevel: 904,
  },
  "lulusia-kingdom": {
    saga: "Final Saga",
    terrain: "temperate",
    description:
      "A kingdom whose people overthrew their king after Sabo's escape from the Reverie. The World Government then erased the whole island from above, leaving a hole in the sea.",
    keyEvents: ["The people of Lulusia rise in revolt", "The island is destroyed by a weapon fired from the sky"],
    visitedBy: people("Sabo"),
    status: "destroyed",
    spoilerLevel: 1060,
  },
  "g-8-branch": {
    terrain: "fortress",
    description: "Navarone, a Marine fortress built inside a ring of rock. The crew falls into it on the way down from Skypiea in a story told only in the anime.",
    visitedBy: STRAW_HATS.slice(0, 7).map((name) => ({ name, kind: "crew" as const, note: "anime-only" as const })),
    affiliation: "Marines",
    status: "active",
    spoilerLevel: 302,
  },

  /* ============================ New World ============================ */

  "new-marineford": {
    saga: "Fish-Man Island Saga",
    terrain: "fortress",
    description:
      "Marine Headquarters since the timeskip. Fleet Admiral Sakazuki moved it into the New World, onto what had been the G-1 base, to put the Marines' full strength next to the Emperors.",
    visitedBy: [...people("Sakazuki", "Borsalino", "Issho"), ...groups("Marines")],
    ruler: "Fleet Admiral Sakazuki",
    affiliation: "Marines",
    status: "active",
    spoilerLevel: 594,
  },
  "g-5-branch": {
    terrain: "fortress",
    description: "A Marine base in the New World known for its rough, rule-breaking men. Vice Admiral Smoker asked to be posted here after the Summit War.",
    visitedBy: people("Smoker", "Tashigi", "Vergo"),
    affiliation: "Marines",
    status: "active",
    spoilerLevel: 699,
  },
  "punk-hazard-island": {
    firstMangaChapter: 655,
    firstAnimeEpisode: 579,
    terrain: "fire-ice",
    description:
      "A former government research island, sealed off after a chemical weapons accident. Two years ago the admirals Akainu and Aokiji fought here for ten days, and left half of it burning and half frozen.",
    keyEvents: [
      "The crew finds kidnapped children being raised on addictive candy",
      "Law proposes an alliance to bring down the Emperor Kaido",
      "Luffy defeats Caesar Clown, and Law cuts Vergo in two",
      "Kin'emon and Momonosuke join the crew's ship",
    ],
    visitedBy: [
      ...crew(9),
      ...people("Trafalgar Law", "Caesar Clown", "Smoker", "Tashigi", "Vergo", "Monet", "Kin'emon", "Momonosuke", "Brownbeard"),
      ...groups("G-5 Marines", "Donquixote Pirates"),
    ],
    affiliation: "Formerly the World Government",
    climate: "Half burning, half frozen",
    features: "Vegapunk's abandoned laboratories; Shinokuni gas",
    status: "unknown",
    spoilerLevel: 699,
  },
  "green-bit": {
    saga: "Dressrosa Saga",
    arc: "Dressrosa",
    terrain: "jungle",
    description:
      "A small overgrown island joined to Dressrosa by an iron bridge that fighting fish have made impassable. Under it is the Tontatta Kingdom of the dwarves.",
    keyEvents: ["Law brings Caesar here for the hostage exchange", "Doflamingo and Admiral Fujitora corner Law", "Robin and Usopp meet the Tontatta"],
    visitedBy: [...member("Nico Robin", "Usopp"), ...people("Trafalgar Law", "Caesar Clown", "Donquixote Doflamingo", "Issho"), ...groups("Tontatta tribe")],
    status: "active",
    spoilerLevel: 801,
  },
  "tontatta-kingdom": {
    terrain: "jungle",
    description: "The underground kingdom of the Tontatta dwarves, beneath Green Bit. They take Usopp for the legendary hero \"Usoland\".",
    ruler: "King Gancho",
    status: "active",
    spoilerLevel: 801,
  },
  "dress-rosa": {
    firstMangaChapter: 701,
    firstAnimeEpisode: 630,
    terrain: "city",
    description:
      "A kingdom of flowers, flamenco and gladiator fights, where living toys walk the streets beside people. The toys are people too: citizens turned into playthings and wiped from everyone's memory by the Warlord king, Doflamingo.",
    keyEvents: [
      "Luffy enters the Corrida Colosseum to win Ace's Mera Mera no Mi",
      "Sabo appears, alive, and takes the fruit",
      "Usopp knocks out Sugar, and every toy turns back at once",
      "Doflamingo's Birdcage closes over the island",
      "Luffy defeats Doflamingo, and the Straw Hat Grand Fleet is formed",
    ],
    visitedBy: [
      ...crew(9),
      ...people("Trafalgar Law", "Donquixote Doflamingo", "Sabo", "Rebecca", "Kyros", "Riku Doldo III", "Issho", "Bartolomeo", "Cavendish", "Kin'emon", "Viola"),
      ...groups("Donquixote Pirates", "Tontatta tribe", "Revolutionary Army", "Straw Hat Grand Fleet"),
    ],
    ruler: "King Riku Doldo III (restored)",
    affiliation: "World Government",
    features: "Corrida Colosseum; the royal plateau; the SMILE factory",
    status: "active",
    spoilerLevel: 801,
  },
  "edd-war": {
    saga: "Four Emperors Saga",
    terrain: "rock",
    description:
      "The stretch of the New World where Gol D. Roger's single ship met the fleet of the Golden Lion Shiki. A storm ended the battle and left a ship's wheel lodged in Shiki's skull.",
    visitedBy: [...flashback("Gol D. Roger", "Shiki", "Silvers Rayleigh"), ...groups("Roger Pirates", "Golden Lion Pirates")],
    status: "active",
    spoilerLevel: 968,
  },
  zou: {
    firstMangaChapter: 802,
    firstAnimeEpisode: 751,
    terrain: "elephant",
    description:
      "A country on the back of Zunesha, an elephant that has walked the sea for a thousand years. It is home to the Mink tribe, who are ruled by two kings: one for the day and one for the night.",
    keyEvents: [
      "The crew learns that Jack destroyed the city looking for the ninja Raizo",
      "The Minks reveal they protected Raizo at any cost, and the two kings make peace",
      "Sanji is taken away to marry into Big Mom's family",
      "A red Road Poneglyph is shown to the crew",
      "The Ninja-Pirate-Mink-Samurai Alliance is formed, and Zunesha sinks Jack's fleet",
    ],
    visitedBy: [
      ...crew(9),
      ...people("Trafalgar Law", "Inuarashi", "Nekomamushi", "Carrot", "Pedro", "Wanda", "Raizo", "Kin'emon", "Momonosuke", "Jack", "Capone Bege"),
      ...groups("Mink tribe", "Heart Pirates", "Beasts Pirates"),
    ],
    ruler: "Duke Inuarashi and Master Nekomamushi",
    affiliation: "Mokomo Dukedom",
    features: "The Whale Tree; a Road Poneglyph; daily showers from Zunesha's trunk",
    status: "active",
    spoilerLevel: 824,
  },
  "mokomo-dukedom": {
    terrain: "elephant",
    description: "The nation of the Mink tribe on Zou, a thousand years old and never once in contact with the World Government.",
    ruler: "Duke Inuarashi and Master Nekomamushi",
    status: "active",
    spoilerLevel: 824,
  },
  "totto-land": {
    saga: "Four Emperors Saga",
    arc: "Whole Cake Island",
    firstMangaChapter: 827,
    terrain: "candy",
    description:
      "Big Mom's territory: thirty-four islands around Whole Cake Island, each run by one of her children as a minister. It is her attempt at a country where every race lives together, and the price of living there is paid in lifespan.",
    visitedBy: [...member("Monkey D. Luffy", "Nami", "Tony Tony Chopper", "Brook", "Sanji"), ...groups("Big Mom Pirates")],
    ruler: "Charlotte Linlin",
    affiliation: "Big Mom Pirates",
    status: "active",
    spoilerLevel: 902,
  },
  "cacao-island": {
    terrain: "candy",
    description: "The chocolate island of Totto Land and the first one the crew lands on. Its minister is Charlotte Pudding, whose café is in Chocolat Town.",
    visitedBy: [...member("Monkey D. Luffy", "Nami", "Tony Tony Chopper", "Brook", "Sanji"), ...people("Charlotte Pudding")],
    ruler: "Minister Charlotte Pudding",
    affiliation: "Big Mom Pirates",
    status: "active",
    spoilerLevel: 902,
  },
  "whole-cake-island": {
    terrain: "candy",
    description:
      "The capital of Totto Land and seat of the Emperor Big Mom, where the buildings are made of sweets and the trees and doors have been given souls. Sanji is brought here to be married off to her daughter Pudding.",
    keyEvents: [
      "Luffy and Nami fight through the Seducing Woods and defeat Cracker",
      "Sanji learns the wedding is a plan to kill his family",
      "The crew and the Fire Tank Pirates crash the Tea Party",
      "Luffy outlasts Katakuri inside the Mirro-World",
      "Jinbe leaves Big Mom's service, and Pedro gives his life for the escape",
    ],
    visitedBy: [
      ...member("Monkey D. Luffy", "Nami", "Tony Tony Chopper", "Brook", "Sanji", "Jinbe"),
      ...people("Charlotte Linlin", "Charlotte Katakuri", "Charlotte Pudding", "Charlotte Cracker", "Capone Bege", "Pedro", "Carrot", "Vinsmoke Judge", "Vinsmoke Reiju"),
      ...groups("Big Mom Pirates", "Germa 66", "Fire Tank Pirates"),
    ],
    ruler: "Charlotte Linlin",
    affiliation: "Big Mom Pirates",
    features: "Whole Cake Chateau; Sweet City; the Seducing Woods; a Road Poneglyph",
    status: "active",
    spoilerLevel: 902,
  },
  "germa-kingdom": {
    saga: "Four Emperors Saga",
    arc: "Whole Cake Island",
    terrain: "fortress",
    description:
      "A kingdom with no land: a fleet of fortress ships carried on giant snails, which can join into one country anywhere at sea. It is ruled by the Vinsmoke family and rented out as the mercenary army Germa 66.",
    visitedBy: [...member("Sanji", "Monkey D. Luffy"), ...people("Vinsmoke Judge", "Vinsmoke Reiju", "Vinsmoke Ichiji", "Vinsmoke Niji", "Vinsmoke Yonji"), ...groups("Germa 66")],
    ruler: "King Vinsmoke Judge",
    features: "Mobile; clone soldiers",
    status: "active",
    spoilerLevel: 902,
  },
  "kari-bari-island": {
    saga: "Four Emperors Saga",
    terrain: "urban",
    description:
      "Karai Bari Island, the circus-tent headquarters of Buggy's Delivery, a company hiring out pirates as mercenaries. After the Warlords were abolished it became the base of Cross Guild.",
    visitedBy: [...people("Buggy", "Crocodile", "Dracule Mihawk"), ...groups("Cross Guild")],
    ruler: "Buggy, in name",
    affiliation: "Cross Guild",
    status: "active",
    spoilerLevel: 1058,
  },
  "wano-country": {
    firstMangaChapter: 909,
    firstAnimeEpisode: 892,
    terrain: "walled",
    description:
      "A country of samurai closed to the outside world, ringed by cliffs that ships can only enter by climbing a waterfall. For twenty years it has been ruled by the shogun Orochi and occupied by the Emperor Kaido, who turned its land into weapons factories.",
    keyEvents: [
      "Luffy is jailed in the Udon prison mines and learns advanced Haki",
      "Zoro gives up Shusui and is given Oden's sword Enma",
      "The story of Kozuki Oden and his execution is told",
      "The alliance sails for Onigashima on the night of the Fire Festival",
      "Kaido and Orochi fall, and Momonosuke becomes shogun",
    ],
    visitedBy: [
      ...crew(10),
      ...people("Trafalgar Law", "Eustass Kid", "Kozuki Momonosuke", "Kin'emon", "Kozuki Hiyori", "Yamato", "Kaido", "Charlotte Linlin", "Kurozumi Orochi", "Tama"),
      ...flashback("Kozuki Oden", "Gol D. Roger", "Edward Newgate"),
      ...groups("Nine Red Scabbards", "Beasts Pirates", "Heart Pirates", "Kid Pirates"),
    ],
    ruler: "Shogun Kozuki Momonosuke (formerly Kurozumi Orochi)",
    affiliation: "Independent; not part of the World Government",
    features: "Flower Capital; six regions; a Road Poneglyph; seastone",
    status: "active",
    spoilerLevel: 1057,
  },
  onigashima: {
    saga: "Four Emperors Saga",
    arc: "Wano Country",
    terrain: "haunted",
    description:
      "A skull-shaped island off the coast of Wano and the fortress of the Beasts Pirates. The whole war for Wano is fought inside it in one night, while Kaido lifts the island into the air to drop it on the capital.",
    keyEvents: [
      "The alliance lands during the Fire Festival banquet",
      "The Red Scabbards wound Kaido on the roof",
      "Luffy's Devil Fruit awakens as he fights Kaido in the sky",
      "Momonosuke sets the island down safely",
    ],
    visitedBy: [
      ...crew(10),
      ...people("Kaido", "Charlotte Linlin", "Yamato", "King", "Queen", "Trafalgar Law", "Eustass Kid", "Kozuki Momonosuke", "Kin'emon"),
      ...groups("Beasts Pirates", "Nine Red Scabbards", "Big Mom Pirates"),
    ],
    affiliation: "Formerly the Beasts Pirates",
    status: "unknown",
    spoilerLevel: 1057,
  },
  "future-island-egghead": {
    firstMangaChapter: 1061,
    firstAnimeEpisode: 1090,
    terrain: "tech",
    description:
      "The island laboratory of Dr. Vegapunk, said to be five hundred years ahead of the rest of the world. It is a winter island kept warm by its own technology, with holograms in the streets and a brain the size of a cloud floating above it.",
    keyEvents: [
      "The crew meets Vegapunk, who has split himself into six satellites",
      "CP0 arrives to kill him for researching the Void Century",
      "Kuma's past and Bonney's are revealed",
      "A Marine fleet and one of the Five Elders besiege the island",
      "Vegapunk's recorded message tells the world it is sinking",
    ],
    visitedBy: [
      ...crew(10),
      ...people("Dr. Vegapunk", "Jewelry Bonney", "Bartholomew Kuma", "Rob Lucci", "Kaku", "Stussy", "Borsalino", "Sentomaru", "Saint Jaygarcia Saturn", "Dorry", "Brogy"),
      ...groups("CP0", "Marines", "Giant Warrior Pirates"),
    ],
    ruler: "Dr. Vegapunk",
    affiliation: "Formerly the World Government",
    climate: "Winter island, climate-controlled",
    features: "Labophase; Fabriophase; Punk Records; an ancient robot",
    status: "unknown",
    spoilerLevel: 1125,
  },
  "punk-records": {
    terrain: "tech",
    description: "Vegapunk's brain, grown too large for his head and kept in a dome above Egghead. Every one of his satellites shares what it knows through it.",
    status: "active",
    spoilerLevel: 1125,
  },
  "elbaph-island": {
    terrain: "tree",
    description:
      "The homeland of the giants and the strongest nation of warriors in the world, built in the branches of the Treasure Tree Adam. Usopp has wanted to see it since he met Dorry and Brogy at Little Garden.",
    keyEvents: ["Big Mom is cast out as a child after a rampage", "The giant Saul brings Ohara's rescued books here", "The crew arrives with the Giant Warrior Pirates"],
    visitedBy: [...crew(10), ...people("Dorry", "Brogy", "Loki", "Shanks"), ...flashback("Charlotte Linlin", "Jaguar D. Saul"), ...groups("Giant Warrior Pirates")],
    affiliation: "Warland Kingdom",
    features: "Treasure Tree Adam; the Owl Library",
    status: "active",
    spoilerLevel: 1140,
  },
  "warland-kingdom": {
    terrain: "tree",
    description: "The kingdom of the giants on Elbaph.",
    status: "active",
    spoilerLevel: 1140,
  },
  "pirate-island-hachinosu": {
    saga: "Final Saga",
    terrain: "haunted",
    description:
      "A pirates' haven shaped like a skull. The Rocks Pirates were formed here decades ago, and it is now the base of the Emperor Blackbeard, who wants the World Government to recognise it as a kingdom.",
    keyEvents: ["Rocks D. Xebec gathers his crew", "Blackbeard makes it his headquarters", "Koby is held prisoner here, and Garp comes to get him"],
    visitedBy: [...people("Marshall D. Teach", "Koby", "Monkey D. Garp", "Kuzan"), ...flashback("Rocks D. Xebec"), ...groups("Blackbeard Pirates", "SWORD")],
    ruler: "Marshall D. Teach",
    affiliation: "Blackbeard Pirates",
    status: "occupied",
    spoilerLevel: 1088,
  },
  sphinx: {
    saga: "Four Emperors Saga",
    terrain: "temperate",
    description:
      "A poor, out-of-the-way island in the New World that was Whitebeard's home. He spent his treasure on it in secret for decades, and since his death Marco has stayed to protect it.",
    visitedBy: [...people("Marco", "Edward Weevil"), ...flashback("Edward Newgate")],
    status: "active",
    spoilerLevel: 909,
  },
  "lode-star-island": {
    saga: "Four Emperors Saga",
    terrain: "rock",
    description:
      "The last island a Log Pose will ever point to, and the place Roger's crew first took for the end of the Grand Line. The real last island, Laugh Tale, lies beyond it and can only be found with the Road Poneglyphs.",
    visitedBy: [...flashback("Gol D. Roger", "Kozuki Oden"), ...groups("Roger Pirates")],
    status: "active",
    spoilerLevel: 967,
  },
};
