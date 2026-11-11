/**
 * Timeline data.
 *
 * Dates and the calendar come from the Library of Ohara timeline v5.0
 * (https://thelibraryofohara.com/the-one-piece-timeline/). It counts in Kaienreki
 * (the Sea Circle Calendar): the story before the timeskip is the year 1522, after it 1524.
 * That page stops at the Egghead Incident, so later arcs carry no Ohara date.
 *
 * Luffy's bounty steps are the ones the Ohara timeline dates. The other bounties and the
 * chapter ranges are from the manga itself. Summaries are written for this site.
 * "inspiration" is the real-world or literary parallel fans most often draw; treat it as
 * commentary, not as a statement from the author.
 */

export type CrewId =
  | "luffy"
  | "zoro"
  | "nami"
  | "usopp"
  | "sanji"
  | "chopper"
  | "robin"
  | "franky"
  | "brook"
  | "jinbe";

export interface CrewMember {
  id: CrewId;
  name: string;
  role: string;
  epithet: string;
  /** Birthday as listed on the Ohara timeline. */
  born: string;
  /** Latest bounty, in Berries. */
  bounty: number;
}

export type CardGlyph =
  | "hat"
  | "swords"
  | "skull"
  | "crown"
  | "flame"
  | "bolt"
  | "anchor"
  | "fish"
  | "ghost"
  | "snow"
  | "sand"
  | "flask"
  | "heart"
  | "gem"
  | "shield"
  | "whale"
  | "castle"
  | "candy"
  | "dragon"
  | "paw"
  | "hammer"
  | "cat"
  | "book"
  | "star";

export type Rarity = "L" | "SEC" | "SR" | "R";

export interface KeyCharacter {
  name: string;
  epithet: string;
  affiliation: string;
  /** Bounty in Berries, or null when the character has none. */
  bounty: number | null;
  /** Qualifier shown under the amount: "frozen as a Warlord", "No bounty", and so on. */
  bountyNote?: string;
  rarity: Rarity;
  glyph: CardGlyph;
  /** Two card colours, dark to light. */
  palette: [string, string];
}

export interface BountyUpdate {
  crew: CrewId;
  amount: number;
  note?: string;
}

export interface UsoppLie {
  /** The tall tale as Usopp told it. */
  lie: string;
  fulfilled: boolean;
  /** How (or whether) it came true. */
  note: string;
}

export interface Arc {
  id: string;
  name: string;
  /** Kaienreki year. */
  opYear: number;
  /** Date as the Ohara timeline gives it. */
  dateLabel: string;
  chapters: string;
  /** Short place line for the card. */
  place: string;
  /** Ids from data/map.ts, so the card can link into the world map. */
  locationIds: string[];
  summary: string;
  inspiration?: string;
  crewJoined: CrewId[];
  /** Allies who sail with the crew for a while without joining for good. */
  guests?: string[];
  keyCharacter: KeyCharacter;
  bountyUpdates?: BountyUpdate[];
  /** Tall tales of Usopp that this arc made true (or left open). */
  usoppLies?: UsoppLie[];
  /** A hidden Pandaman lives on this card. Exactly three arcs set this. */
  pandaman?: boolean;
  /** The Romance Dawn tribute: a tiny dachshund in a straw hat. */
  dachshund?: boolean;
}

export interface Saga {
  id: string;
  name: string;
  tagline: string;
  /** Kaienreki span covered by the saga. */
  years: string;
  /** Accent colour for the banner. */
  accent: string;
  /** Hovering this saga turns the cursor into the Alabasta "X". */
  alabastaCursor?: boolean;
  arcs: Arc[];
}

export const CREW: Record<CrewId, CrewMember> = {
  luffy: { id: "luffy", name: "Monkey D. Luffy", role: "Captain", epithet: "Straw Hat", born: "May 5th, 1505", bounty: 3_000_000_000 },
  zoro: { id: "zoro", name: "Roronoa Zoro", role: "Swordsman", epithet: "Pirate Hunter", born: "November 11th, 1503", bounty: 1_111_000_000 },
  nami: { id: "nami", name: "Nami", role: "Navigator", epithet: "Cat Burglar", born: "July 3rd, 1504", bounty: 366_000_000 },
  usopp: { id: "usopp", name: "Usopp", role: "Sniper", epithet: "God", born: "April 1st, 1505", bounty: 500_000_000 },
  sanji: { id: "sanji", name: "Sanji", role: "Cook", epithet: "Black Leg", born: "March 2nd, 1503", bounty: 1_032_000_000 },
  chopper: { id: "chopper", name: "Tony Tony Chopper", role: "Doctor", epithet: "Cotton Candy Lover", born: "December 24th, 1507", bounty: 1_000 },
  robin: { id: "robin", name: "Nico Robin", role: "Archaeologist", epithet: "Devil Child", born: "February 6th, 1494", bounty: 930_000_000 },
  franky: { id: "franky", name: "Franky", role: "Shipwright", epithet: "Iron Man", born: "March 9th, 1488", bounty: 394_000_000 },
  brook: { id: "brook", name: "Brook", role: "Musician", epithet: "Soul King", born: "April 3rd, 1434", bounty: 383_000_000 },
  jinbe: { id: "jinbe", name: "Jinbe", role: "Helmsman", epithet: "Knight of the Sea", born: "April 2nd, 1478", bounty: 1_100_000_000 },
};

export const SAGAS: Saga[] = [
  /* ================================================================== */
  {
    id: "east-blue",
    name: "East Blue Saga",
    tagline: "A boy in a barrel, a rubber body, and a promise to a red-haired pirate.",
    years: "1522",
    accent: "#2f8fb8",
    arcs: [
      {
        id: "romance-dawn",
        name: "Romance Dawn",
        opYear: 1522,
        dateLabel: "Around February, 1522",
        chapters: "Ch. 1-7",
        place: "Foosha Village, Goat Island, Shells Town",
        locationIds: ["foosha-village", "goat-island", "shells-town"],
        summary:
          "Ten years after Shanks left him a straw hat, Luffy rows out of Foosha Village at seventeen. He frees the cabin boy Koby from Alvida, then walks into a Marine base to recruit a swordsman tied to a post in the yard.",
        inspiration: "Foosha means windmill: a sleepy village of Dutch-style windmills.",
        crewJoined: ["luffy", "zoro"],
        keyCharacter: {
          name: "Monkey D. Luffy",
          epithet: "Straw Hat",
          affiliation: "Straw Hat Pirates",
          bounty: null,
          bountyNote: "Not yet wanted",
          rarity: "L",
          glyph: "hat",
          palette: ["#7a1410", "#e2553c"],
        },
        dachshund: true,
      },
      {
        id: "orange-town",
        name: "Orange Town",
        opYear: 1522,
        dateLabel: "Around February, 1522",
        chapters: "Ch. 8-21",
        place: "Organ Archipelago, East Blue",
        locationIds: ["orange-town", "rare-animal-island"],
        summary:
          "A thief named Nami sells Luffy to Buggy the Clown, changes her mind, and helps him flatten the circus instead. A small dog still guarding his late master's shop gives Luffy his first reason to get truly angry.",
        crewJoined: ["nami"],
        keyCharacter: {
          name: "Buggy",
          epithet: "The Clown",
          affiliation: "Buggy Pirates",
          bounty: 15_000_000,
          rarity: "R",
          glyph: "star",
          palette: ["#1d3f8a", "#e2483d"],
        },
      },
      {
        id: "syrup-village",
        name: "Syrup Village",
        opYear: 1522,
        dateLabel: "Around February 11th-12th, 1522",
        chapters: "Ch. 22-41",
        place: "Gecko Archipelago, East Blue",
        locationIds: ["syrup-village"],
        summary:
          "Every morning Usopp runs through the village shouting that pirates are coming. Then the butler Klahadore turns out to be Captain Kuro, and nobody believes the one true warning. The crew leaves with a sniper and a ship: the Going Merry.",
        crewJoined: ["usopp"],
        keyCharacter: {
          name: "Kuro",
          epithet: "Of a Hundred Plans",
          affiliation: "Black Cat Pirates",
          bounty: 16_000_000,
          rarity: "R",
          glyph: "cat",
          palette: ["#15171c", "#6c7480"],
        },
        usoppLies: [
          {
            lie: "\"The pirates are coming!\"",
            fulfilled: true,
            note: "His daily false alarm came true the morning the Black Cat Pirates landed on the north shore.",
          },
        ],
      },
      {
        id: "baratie",
        name: "Baratie",
        opYear: 1522,
        dateLabel: "Around February 14th, 1522",
        chapters: "Ch. 42-68",
        place: "Sambas Sea Region, East Blue",
        locationIds: ["baratie"],
        summary:
          "At a floating restaurant run by ex-pirates, a cook feeds a starving enemy and nearly loses the ship for it. Zoro meets Mihawk, the strongest swordsman alive, loses in one stroke, and swears never to lose again.",
        inspiration: "A sea-going restaurant ship, the kind moored in harbours across East Asia.",
        crewJoined: ["sanji"],
        keyCharacter: {
          name: "Don Krieg",
          epithet: "Foul Play",
          affiliation: "Krieg Pirates",
          bounty: 17_000_000,
          rarity: "R",
          glyph: "shield",
          palette: ["#4a3a12", "#d9b548"],
        },
      },
      {
        id: "arlong-park",
        name: "Arlong Park",
        opYear: 1522,
        dateLabel: "Around February 15th, 1522",
        chapters: "Ch. 69-95",
        place: "Conomi Archipelago, East Blue",
        locationIds: ["arlong-park", "cocoyasi-village"],
        summary:
          "Nami has spent eight years buying her village back from the fish-man who killed her mother. When Arlong cheats her out of the money, she finally asks for help. Luffy puts his hat on her head and tears the building down.",
        crewJoined: [],
        keyCharacter: {
          name: "Arlong",
          epithet: "The Saw",
          affiliation: "Arlong Pirates",
          bounty: 20_000_000,
          rarity: "SR",
          glyph: "fish",
          palette: ["#0d3b52", "#3fa7c9"],
        },
      },
      {
        id: "loguetown",
        name: "Loguetown",
        opYear: 1522,
        dateLabel: "February 18th, 1522",
        chapters: "Ch. 96-100",
        place: "Pole Star Archipelago, East Blue",
        locationIds: ["loguetown"],
        summary:
          "In the town where Gol D. Roger was born and executed, Luffy ends up on the same scaffold, smiling. Lightning, a storm and a cloaked stranger get him off it, and the Going Merry heads for the mountain.",
        inspiration: "The town of the beginning and the end: prologue and epilogue.",
        crewJoined: [],
        keyCharacter: {
          name: "Monkey D. Luffy",
          epithet: "Straw Hat",
          affiliation: "Straw Hat Pirates",
          bounty: 30_000_000,
          bountyNote: "First bounty, the highest in East Blue",
          rarity: "SR",
          glyph: "hat",
          palette: ["#7a1410", "#e2553c"],
        },
        bountyUpdates: [{ crew: "luffy", amount: 30_000_000, note: "First bounty" }],
        pandaman: true,
      },
    ],
  },

  /* ================================================================== */
  {
    id: "alabasta",
    name: "Alabasta Saga",
    tagline: "A princess in disguise, a desert at war, and an X that proves who your friends are.",
    years: "1522",
    accent: "#d19a2e",
    alabastaCursor: true,
    arcs: [
      {
        id: "reverse-mountain",
        name: "Reverse Mountain",
        opYear: 1522,
        dateLabel: "February 18th, 1522",
        chapters: "Ch. 101-105",
        place: "Red Line, Twin Capes",
        locationIds: ["reverse-mountain", "twin-capes"],
        summary:
          "Four currents climb the Red Line and pour down into the Grand Line as one. At the bottom waits Laboon, a whale who has rammed the continent for fifty years waiting for a crew that promised to come back.",
        crewJoined: [],
        keyCharacter: {
          name: "Laboon",
          epithet: "The Island Whale",
          affiliation: "Twin Capes",
          bounty: null,
          bountyNote: "No bounty. Still waiting.",
          rarity: "SR",
          glyph: "whale",
          palette: ["#12304f", "#5b8fc4"],
        },
      },
      {
        id: "whisky-peak",
        name: "Whisky Peak",
        opYear: 1522,
        dateLabel: "February 18th-19th, 1522",
        chapters: "Ch. 106-114",
        place: "Cactus Island, Paradise",
        locationIds: ["whisky-peak", "cactus-island"],
        summary:
          "A town that throws a feast for every pirate crew turns out to be a hundred bounty hunters. Zoro handles them alone. Miss Wednesday is unmasked as Princess Vivi, and the crew agrees to take her home.",
        crewJoined: [],
        guests: ["Nefertari Vivi", "Karoo"],
        keyCharacter: {
          name: "Nefertari Vivi",
          epithet: "Miss Wednesday",
          affiliation: "Alabasta Kingdom",
          bounty: null,
          bountyNote: "No bounty",
          rarity: "SR",
          glyph: "crown",
          palette: ["#1f5c8f", "#8fd0ef"],
        },
      },
      {
        id: "little-garden",
        name: "Little Garden",
        opYear: 1522,
        dateLabel: "February 19th, 1522",
        chapters: "Ch. 115-129",
        place: "Giant Island Little Garden, Paradise",
        locationIds: ["giant-island-little-garden"],
        summary:
          "On an island that never left the age of dinosaurs, two giants of Elbaf have duelled for a century over a quarrel neither remembers. Usopp decides on the spot what kind of warrior he wants to be.",
        inspiration: "Conan Doyle's The Lost World: a land where prehistory never ended.",
        crewJoined: [],
        keyCharacter: {
          name: "Dorry & Brogy",
          epithet: "Blue Ogre & Red Ogre",
          affiliation: "Giant Warrior Pirates",
          bounty: 100_000_000,
          bountyNote: "Each, issued a century ago",
          rarity: "SR",
          glyph: "swords",
          palette: ["#3b2a66", "#b0452c"],
        },
        usoppLies: [
          {
            lie: "A giant goldfish so big that he mistook its droppings for an island.",
            fulfilled: true,
            note: "The Island Eater surfaces as the Merry leaves Little Garden, and its droppings really are the size of an island. Dorry and Brogy blast a hole through it.",
          },
        ],
      },
      {
        id: "drum-island",
        name: "Drum Island",
        opYear: 1522,
        dateLabel: "February 20th-21st, 1522",
        chapters: "Ch. 130-154",
        place: "Drum Island, Paradise",
        locationIds: ["drum-island", "sakura-kingdom"],
        summary:
          "Nami is dying of a fever and the only doctor lives on top of a mountain. Luffy climbs it barehanded with her on his back. In the castle is a blue-nosed reindeer who was promised that cherry blossoms could cure a country.",
        crewJoined: ["chopper"],
        keyCharacter: {
          name: "Tony Tony Chopper",
          epithet: "Cotton Candy Lover",
          affiliation: "Straw Hat Pirates",
          bounty: 50,
          bountyNote: "First bounty, issued after Enies Lobby",
          rarity: "SR",
          glyph: "snow",
          palette: ["#8a2a50", "#f4a6c0"],
        },
      },
      {
        id: "alabasta",
        name: "Alabasta",
        opYear: 1522,
        dateLabel: "March 2nd-8th, 1522",
        chapters: "Ch. 155-217",
        place: "Sandy Island, Paradise",
        locationIds: ["alabasta-kingdom", "sandy-island"],
        summary:
          "A Warlord has been stealing the rain to turn a kingdom against its king. Luffy loses to Crocodile twice and wins the third time, under the royal tomb. The crew says goodbye to Vivi without a word, left arms raised.",
        inspiration: "Ancient Egypt: a desert kingdom of royal tombs along a great river.",
        crewJoined: ["robin"],
        keyCharacter: {
          name: "Crocodile",
          epithet: "Sir Crocodile",
          affiliation: "Baroque Works",
          bounty: 81_000_000,
          bountyNote: "Frozen while he was a Warlord",
          rarity: "SEC",
          glyph: "sand",
          palette: ["#3d2a10", "#c9a55a"],
        },
        bountyUpdates: [
          { crew: "luffy", amount: 100_000_000 },
          { crew: "zoro", amount: 60_000_000, note: "First bounty" },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "sky-island",
    name: "Sky Island Saga",
    tagline: "People's dreams never end.",
    years: "1522",
    accent: "#e9c558",
    arcs: [
      {
        id: "jaya",
        name: "Jaya",
        opYear: 1522,
        dateLabel: "March 9th, 1522",
        chapters: "Ch. 218-236",
        place: "Mock Town, Jaya Island",
        locationIds: ["jaya-island", "mock-town"],
        summary:
          "The Log Pose points straight up. In a town that laughs at dreamers, Luffy takes a beating without lifting a hand, then meets the descendant of Noland the Liar, who has spent his life diving for a city of gold.",
        inspiration: "A lawless Caribbean pirate port in the mould of Port Royal.",
        crewJoined: [],
        keyCharacter: {
          name: "Bellamy",
          epithet: "The Hyena",
          affiliation: "Bellamy Pirates",
          bounty: 55_000_000,
          rarity: "R",
          glyph: "bolt",
          palette: ["#3f3410", "#e6d24a"],
        },
      },
      {
        id: "skypiea",
        name: "Skypiea",
        opYear: 1522,
        dateLabel: "March 9th-10th, 1522",
        chapters: "Ch. 237-302",
        place: "Godland Skypiea, White-White Sea",
        locationIds: ["godland-skypiea", "sky-sea"],
        summary:
          "Ten thousand metres up, a self-made god rules by lightning, and half of Jaya has been in the sky for four hundred years. Luffy, made of rubber, is the one man Enel cannot hurt. He rings the golden bell so the people below can hear it.",
        inspiration: "El Dorado: a lost city of gold among Mesoamerican-style ruins.",
        crewJoined: [],
        keyCharacter: {
          name: "Enel",
          epithet: "God",
          affiliation: "Skypiea",
          bounty: null,
          bountyNote: "No bounty. Unknown to the Blue Sea.",
          rarity: "SEC",
          glyph: "bolt",
          palette: ["#2a3a66", "#f4e27a"],
        },
      },
    ],
  },

  /* ================================================================== */
  {
    id: "water-7",
    name: "Water 7 Saga",
    tagline: "A ship that carried them as far as it could, and a friend who said she wanted to live.",
    years: "1522",
    accent: "#3fa3b5",
    arcs: [
      {
        id: "long-ring-long-land",
        name: "Long Ring Long Land",
        opYear: 1522,
        dateLabel: "March 11th-16th, 1522",
        chapters: "Ch. 303-321",
        place: "Long Ring Long Land, Paradise",
        locationIds: ["long-ring-long-land"],
        summary:
          "A game of Davy Back Fight against Foxy, a pirate who steals crewmates instead of treasure. Then an Admiral strolls up on a bicycle, freezes the sea, and shows the crew how far they still have to go.",
        crewJoined: [],
        keyCharacter: {
          name: "Foxy",
          epithet: "The Silver Fox",
          affiliation: "Foxy Pirates",
          bounty: 24_000_000,
          rarity: "R",
          glyph: "star",
          palette: ["#3a3f4a", "#c4ccd6"],
        },
      },
      {
        id: "water-7",
        name: "Water 7",
        opYear: 1522,
        dateLabel: "March 18th-19th, 1522",
        chapters: "Ch. 322-374",
        place: "Shipbuilding Island, Paradise",
        locationIds: ["water-seven", "shipbuilding-island"],
        summary:
          "The shipwrights say the Going Merry cannot be repaired. Usopp cannot accept it, duels his captain and leaves. The same night Robin walks away with the government's assassins, and the crew comes apart.",
        inspiration: "Venice: a city of canals and gondoliers, slowly sinking into the sea.",
        crewJoined: [],
        keyCharacter: {
          name: "Nico Robin",
          epithet: "Devil Child",
          affiliation: "Straw Hat Pirates",
          bounty: 79_000_000,
          bountyNote: "Held since she was eight years old",
          rarity: "SEC",
          glyph: "book",
          palette: ["#2c1f4d", "#9a7fd6"],
        },
      },
      {
        id: "enies-lobby",
        name: "Enies Lobby",
        opYear: 1522,
        dateLabel: "March 20th, 1522",
        chapters: "Ch. 375-430",
        place: "Enies Lobby, Paradise",
        locationIds: ["enies-lobby"],
        summary:
          "The crew invades the government's judicial island and burns its flag, to tell one woman she is allowed to want to live. The Going Merry sails in alone to carry them home, and is given a Viking funeral at sea.",
        crewJoined: [],
        keyCharacter: {
          name: "Rob Lucci",
          epithet: "CP9's Strongest",
          affiliation: "Cipher Pol No. 9",
          bounty: null,
          bountyNote: "No bounty. Government assassin.",
          rarity: "SEC",
          glyph: "cat",
          palette: ["#1a1a1f", "#d8c27a"],
        },
      },
      {
        id: "post-enies-lobby",
        name: "Post-Enies Lobby",
        opYear: 1522,
        dateLabel: "March 22nd-25th, 1522",
        chapters: "Ch. 431-441",
        place: "Water Seven, Paradise",
        locationIds: ["water-seven"],
        summary:
          "Garp drops by and casually names Luffy's father. Franky builds a ship from the wood of the Treasure Tree Adam, Usopp apologises at the top of his lungs from the pier, and the Thousand Sunny sets sail.",
        crewJoined: ["franky"],
        keyCharacter: {
          name: "Franky",
          epithet: "Cutty Flam",
          affiliation: "Straw Hat Pirates",
          bounty: 44_000_000,
          rarity: "SR",
          glyph: "hammer",
          palette: ["#0e4a66", "#59c7e8"],
        },
        bountyUpdates: [
          { crew: "luffy", amount: 300_000_000 },
          { crew: "zoro", amount: 120_000_000 },
          { crew: "robin", amount: 80_000_000 },
          { crew: "sanji", amount: 77_000_000, note: "First bounty" },
          { crew: "franky", amount: 44_000_000, note: "First bounty" },
          { crew: "usopp", amount: 30_000_000, note: "As Sogeking" },
          { crew: "nami", amount: 16_000_000, note: "First bounty" },
          { crew: "chopper", amount: 50, note: "Listed as the crew's pet" },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "thriller-bark",
    name: "Thriller Bark Saga",
    tagline: "A skeleton, a stolen shadow, and a promise fifty years overdue.",
    years: "1522",
    accent: "#8a6fc0",
    arcs: [
      {
        id: "thriller-bark",
        name: "Thriller Bark",
        opYear: 1522,
        dateLabel: "Around March 25th-29th, 1522",
        chapters: "Ch. 442-489",
        place: "Florian Triangle, Paradise",
        locationIds: ["thriller-bark", "florian-triangle"],
        summary:
          "In the fog of the Florian Triangle drifts the biggest ship in the world, crewed by zombies that walk on stolen shadows. Afterwards Kuma offers to spare the crew for Luffy's head, and Zoro takes his captain's pain instead. Nothing happened.",
        inspiration: "The Bermuda Triangle, by way of Gothic horror.",
        crewJoined: ["brook"],
        keyCharacter: {
          name: "Gecko Moria",
          epithet: "Shadow Master",
          affiliation: "Thriller Bark Pirates",
          bounty: 320_000_000,
          bountyNote: "Frozen while he was a Warlord",
          rarity: "SEC",
          glyph: "ghost",
          palette: ["#231a3a", "#8f6fd0"],
        },
      },
    ],
  },

  /* ================================================================== */
  {
    id: "summit-war",
    name: "Summit War Saga",
    tagline: "The crew is gone, and Luffy runs toward the war to save his brother.",
    years: "1522-1524",
    accent: "#c8452f",
    arcs: [
      {
        id: "sabaody-archipelago",
        name: "Sabaody Archipelago",
        opYear: 1522,
        dateLabel: "April 1522, Summit War day 1",
        chapters: "Ch. 490-513",
        place: "Sabaody Archipelago, Paradise",
        locationIds: ["sabaody-archipelago"],
        summary:
          "Eleven Supernovas gather at the foot of the Red Line. Luffy punches a Celestial Dragon in the face in the middle of a slave auction. An Admiral arrives, and Kuma makes the whole crew vanish one by one while their captain watches.",
        crewJoined: [],
        keyCharacter: {
          name: "Bartholomew Kuma",
          epithet: "The Tyrant",
          affiliation: "Seven Warlords of the Sea",
          bounty: 296_000_000,
          bountyNote: "Frozen while he was a Warlord",
          rarity: "SEC",
          glyph: "paw",
          palette: ["#2a2a33", "#b9a47a"],
        },
        pandaman: true,
      },
      {
        id: "amazon-lily",
        name: "Amazon Lily",
        opYear: 1522,
        dateLabel: "April 1522, Summit War days 2-4",
        chapters: "Ch. 514-524",
        place: "Island of Women, Calm Belt",
        locationIds: ["island-of-women", "amazon-lily-empire"],
        summary:
          "Luffy lands alone on an island where no man may set foot, ruled by the Pirate Empress. He shields her secret with his own body, and Boa Hancock, who trusts no one, agrees to smuggle him into the world's worst prison.",
        inspiration: "The Amazons of Greek myth: a nation of warrior women.",
        crewJoined: [],
        keyCharacter: {
          name: "Boa Hancock",
          epithet: "Pirate Empress",
          affiliation: "Kuja Pirates",
          bounty: 80_000_000,
          bountyNote: "Frozen while she was a Warlord",
          rarity: "SEC",
          glyph: "heart",
          palette: ["#5a1030", "#f08fb2"],
        },
      },
      {
        id: "impel-down",
        name: "Impel Down",
        opYear: 1522,
        dateLabel: "April 1522, Summit War days 9-10",
        chapters: "Ch. 525-549",
        place: "Impel Down, Calm Belt",
        locationIds: ["impel-down"],
        summary:
          "Six levels down, then back up again. Luffy is poisoned to the edge of death, healed at the cost of ten years of his life, and breaks out with the largest jailbreak in history. Mr. 2 stays behind to hold the gate.",
        inspiration: "Dante's Inferno: a prison that descends in circles of hell.",
        crewJoined: [],
        keyCharacter: {
          name: "Magellan",
          epithet: "Chief Warden",
          affiliation: "Impel Down",
          bounty: null,
          bountyNote: "No bounty. He keeps the people who have them.",
          rarity: "SR",
          glyph: "flask",
          palette: ["#2b1140", "#a04fd0"],
        },
      },
      {
        id: "marineford",
        name: "Marineford",
        opYear: 1522,
        dateLabel: "April 1522, Summit War day 10",
        chapters: "Ch. 550-580",
        place: "Marineford, Paradise",
        locationIds: ["marineford"],
        summary:
          "Whitebeard brings his fleet to Marine Headquarters to take back one son. Ace is freed and dies shielding Luffy from Akainu. Whitebeard falls standing, without a single wound on his back, and says with his last breath that the One Piece is real.",
        crewJoined: [],
        keyCharacter: {
          name: "Portgas D. Ace",
          epithet: "Fire Fist",
          affiliation: "Whitebeard Pirates",
          bounty: 550_000_000,
          rarity: "SEC",
          glyph: "flame",
          palette: ["#6a1a08", "#f59a2e"],
        },
      },
      {
        id: "post-war",
        name: "Post-War and 3D2Y",
        opYear: 1522,
        dateLabel: "1522-1524, the timeskip",
        chapters: "Ch. 581-597",
        place: "Island of Women, Rusukaina",
        locationIds: ["island-of-women", "rusukaina"],
        summary:
          "Luffy remembers that he still has his crew. He returns to Marineford, rings the Ox Bell sixteen times, and shows the world a message on his arm: not three days, two years. Rayleigh trains him on Rusukaina while the others grow stronger apart.",
        crewJoined: [],
        keyCharacter: {
          name: "Monkey D. Luffy",
          epithet: "Straw Hat",
          affiliation: "Straw Hat Pirates",
          bounty: 400_000_000,
          bountyNote: "Raised during the timeskip",
          rarity: "L",
          glyph: "hat",
          palette: ["#7a1410", "#e2553c"],
        },
        bountyUpdates: [{ crew: "luffy", amount: 400_000_000, note: "Raised during the timeskip" }],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "fish-man-island",
    name: "Fish-Man Island Saga",
    tagline: "Two years later, ten thousand metres down.",
    years: "1524",
    accent: "#35b3a6",
    arcs: [
      {
        id: "return-to-sabaody",
        name: "Return to Sabaody",
        opYear: 1524,
        dateLabel: "Around February 4th-6th, 1524",
        chapters: "Ch. 598-602",
        place: "Sabaody Archipelago, Paradise",
        locationIds: ["sabaody-archipelago"],
        summary:
          "The crew reunites on Sabaody and finds a gang of impostors recruiting under its name. The fake Luffy lasts about four seconds. The real one waves goodbye to Rayleigh and the Sunny sinks, on purpose, toward the sea floor.",
        crewJoined: [],
        keyCharacter: {
          name: "Demaro Black",
          epithet: "Three-Tongued",
          affiliation: "Fake Straw Hat Pirates",
          bounty: 26_000_000,
          rarity: "R",
          glyph: "skull",
          palette: ["#3a2a1a", "#a88a5a"],
        },
      },
      {
        id: "fish-man-island",
        name: "Fish-Man Island",
        opYear: 1524,
        dateLabel: "Around February 4th-6th, 1524",
        chapters: "Ch. 603-653",
        place: "Ryugu Kingdom, beneath the Red Line",
        locationIds: ["fish-man-island", "ryugu-kingdom"],
        summary:
          "A coup by fish-men raised on a hatred they never lived through. Luffy knocks out fifty thousand of them at a glance, a mermaid princess learns she can command Sea Kings, and Luffy picks a fight with an Emperor over a box of sweets.",
        inspiration: "Ryugu-jo, the undersea Dragon Palace of the Urashima Taro folktale.",
        crewJoined: [],
        keyCharacter: {
          name: "Jinbe",
          epithet: "Knight of the Sea",
          affiliation: "Sun Pirates",
          bounty: 438_000_000,
          bountyNote: "After resigning as a Warlord",
          rarity: "SEC",
          glyph: "fish",
          palette: ["#0e3554", "#4fa3d8"],
        },
      },
    ],
  },

  /* ================================================================== */
  {
    id: "dressrosa",
    name: "Dressrosa Saga",
    tagline: "An alliance with a Warlord, and a kingdom where toys were once people.",
    years: "1524",
    accent: "#d6567a",
    arcs: [
      {
        id: "punk-hazard",
        name: "Punk Hazard",
        opYear: 1524,
        dateLabel: "Around February 6th, 1524",
        chapters: "Ch. 654-699",
        place: "Punk Hazard Island, New World",
        locationIds: ["punk-hazard-island"],
        summary:
          "Half the island burns and half is frozen: what is left after two Admirals fought ten days over one chair. Inside the lab are kidnapped children and a gas weapon. Trafalgar Law proposes an alliance to bring down an Emperor.",
        crewJoined: [],
        guests: ["Trafalgar Law", "Kin'emon", "Momonosuke"],
        keyCharacter: {
          name: "Trafalgar Law",
          epithet: "Surgeon of Death",
          affiliation: "Heart Pirates",
          bounty: 440_000_000,
          bountyNote: "Frozen while he was a Warlord",
          rarity: "SEC",
          glyph: "heart",
          palette: ["#1c2a3a", "#f0d24a"],
        },
      },
      {
        id: "dressrosa",
        name: "Dressrosa",
        opYear: 1524,
        dateLabel: "Around February 7th-10th, 1524",
        chapters: "Ch. 700-801",
        place: "Dress Rosa, New World",
        locationIds: ["dress-rosa", "green-bit", "tontatta-kingdom"],
        summary:
          "A country that forgot its own families when they were turned into toys. Luffy enters a gladiator tournament for his brother's Devil Fruit and finds his other brother alive. Doflamingo's birdcage closes on the island, and Gear Fourth breaks it.",
        inspiration: "Spain: flamenco, sunflowers, and a colosseum built for bullfights.",
        crewJoined: [],
        keyCharacter: {
          name: "Donquixote Doflamingo",
          epithet: "Heavenly Yaksha",
          affiliation: "Donquixote Pirates",
          bounty: 340_000_000,
          bountyNote: "Frozen while he was a Warlord",
          rarity: "SEC",
          glyph: "crown",
          palette: ["#5a1040", "#f2a0c8"],
        },
        bountyUpdates: [
          { crew: "luffy", amount: 500_000_000 },
          { crew: "zoro", amount: 320_000_000 },
          { crew: "usopp", amount: 200_000_000, note: "As \"God\" Usopp" },
          { crew: "sanji", amount: 177_000_000, note: "Only Alive" },
          { crew: "robin", amount: 130_000_000 },
          { crew: "franky", amount: 94_000_000 },
          { crew: "brook", amount: 83_000_000 },
          { crew: "nami", amount: 66_000_000 },
          { crew: "chopper", amount: 100 },
        ],
        usoppLies: [
          {
            lie: "A land of dwarves, tiny people he told Kaya he had met on his adventures.",
            fulfilled: true,
            note: "The Tontatta tribe of Green Bit are exactly that. They take him for their legendary hero \"Usoland\", and for once he lives up to the story.",
          },
          {
            lie: "\"I am Captain Usopp, and I have eight thousand followers!\"",
            fulfilled: false,
            note: "Still open. The Straw Hat Grand Fleet that forms here counts 5,600, and it keeps growing.",
          },
        ],
        pandaman: true,
      },
    ],
  },

  /* ================================================================== */
  {
    id: "four-emperors",
    name: "Four Emperors Saga",
    tagline: "A wedding to crash, a country to open, and two Emperors to bring down.",
    years: "1524",
    accent: "#b06ad0",
    arcs: [
      {
        id: "zou",
        name: "Zou",
        opYear: 1524,
        dateLabel: "Around February 18th-19th, 1524",
        chapters: "Ch. 802-824",
        place: "Zou, wandering the New World",
        locationIds: ["zou", "mokomo-dukedom"],
        summary:
          "A country on the back of an elephant that has walked the sea for a thousand years. The Minks were tortured for a ninja they never gave up. Sanji is gone, taken to a wedding, and a red stone shows the way to the last island.",
        inspiration: "Zou is Japanese for elephant: the world-bearing beast of old cosmologies.",
        crewJoined: [],
        keyCharacter: {
          name: "Jack",
          epithet: "The Drought",
          affiliation: "Beasts Pirates",
          bounty: 1_000_000_000,
          rarity: "SR",
          glyph: "skull",
          palette: ["#3a2a12", "#c9853a"],
        },
      },
      {
        id: "whole-cake-island",
        name: "Whole Cake Island",
        opYear: 1524,
        dateLabel: "February 26th - March 1st, 1524",
        chapters: "Ch. 825-902",
        place: "Totto Land, New World",
        locationIds: ["whole-cake-island", "totto-land", "cacao-island"],
        summary:
          "Luffy waits in the rain without eating until Sanji comes back. The crew crashes an Emperor's tea party, Luffy outlasts Katakuri inside a mirror, and Jinbe turns his cup upside down in front of Big Mom to join the crew.",
        inspiration: "Fairy-tale confectionery: a gingerbread-house kingdom out of Hansel and Gretel.",
        crewJoined: ["jinbe"],
        keyCharacter: {
          name: "Charlotte Katakuri",
          epithet: "Sweet Commander",
          affiliation: "Big Mom Pirates",
          bounty: 1_057_000_000,
          rarity: "SEC",
          glyph: "candy",
          palette: ["#4a1030", "#d05a8a"],
        },
        bountyUpdates: [
          { crew: "luffy", amount: 1_500_000_000, note: "Named the \"Fifth Emperor\"" },
          { crew: "sanji", amount: 330_000_000 },
        ],
      },
      {
        id: "reverie",
        name: "Reverie",
        opYear: 1524,
        dateLabel: "March 3rd-9th, 1524",
        chapters: "Ch. 903-908",
        place: "Holyland Mary Geoise, Red Line",
        locationIds: ["holyland-mary-geoise"],
        summary:
          "Fifty kings meet on top of the Red Line for seven days. The Warlord system is voted out of existence, a king of Alabasta is killed, and someone is sitting on a throne that is supposed to be empty.",
        crewJoined: [],
        keyCharacter: {
          name: "Sabo",
          epithet: "Flame Emperor",
          affiliation: "Revolutionary Army",
          bounty: 602_000_000,
          rarity: "SEC",
          glyph: "flame",
          palette: ["#14244a", "#f2a83a"],
        },
      },
      {
        id: "wano",
        name: "Wano Country",
        opYear: 1524,
        dateLabel: "March 3rd-24th, 1524",
        chapters: "Ch. 909-1057",
        place: "Wano Country and Onigashima, New World",
        locationIds: ["wano-country", "onigashima"],
        summary:
          "A closed country that has waited twenty years for nine samurai to come back. On the night of the Fire Festival five thousand rebels storm Onigashima. Luffy dies on the roof, his heart starts again to the sound of drums, and Kaido falls.",
        inspiration: "Edo-period Japan: a shogunate closed to the outside world.",
        crewJoined: [],
        keyCharacter: {
          name: "Kaido",
          epithet: "Of the Beasts",
          affiliation: "Beasts Pirates",
          bounty: 4_611_100_000,
          rarity: "SEC",
          glyph: "dragon",
          palette: ["#1e1a4a", "#6f8fe8"],
        },
        bountyUpdates: [
          { crew: "luffy", amount: 3_000_000_000, note: "Named an Emperor" },
          { crew: "zoro", amount: 1_111_000_000 },
          { crew: "jinbe", amount: 1_100_000_000 },
          { crew: "sanji", amount: 1_032_000_000 },
          { crew: "robin", amount: 930_000_000 },
          { crew: "usopp", amount: 500_000_000 },
          { crew: "franky", amount: 394_000_000 },
          { crew: "brook", amount: 383_000_000 },
          { crew: "nami", amount: 366_000_000 },
          { crew: "chopper", amount: 1_000 },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "final",
    name: "Final Saga",
    tagline: "The sea begins to rise, and the world learns what was erased.",
    years: "1524 onward",
    accent: "#e0b84a",
    arcs: [
      {
        id: "egghead",
        name: "Egghead",
        opYear: 1524,
        dateLabel: "April 7th-12th, 1524",
        chapters: "Ch. 1058-1125",
        place: "Future Island Egghead, New World",
        locationIds: ["future-island-egghead", "punk-records"],
        summary:
          "An island five hundred years ahead of its time, and the scientist who built it marked for death for studying the Void Century. A hundred warships surround Egghead, an ancient iron giant wakes to the Drums of Liberation, and a broadcast tells the world it is sinking.",
        inspiration: "Mid-century retro-futurism: the city of tomorrow as the past imagined it.",
        crewJoined: [],
        keyCharacter: {
          name: "Jewelry Bonney",
          epithet: "Big Eater",
          affiliation: "Bonney Pirates",
          bounty: 320_000_000,
          rarity: "SEC",
          glyph: "gem",
          palette: ["#5a1848", "#f29ad0"],
        },
      },
      {
        id: "elbaf",
        name: "Elbaf",
        opYear: 1524,
        dateLabel: "Not yet dated: the Ohara timeline ends at Egghead",
        chapters: "Ch. 1126 onward",
        place: "Elbaph Island, New World",
        locationIds: ["elbaph-island", "warland-kingdom"],
        summary:
          "The land of giants that Usopp swore at Little Garden he would see one day. A kingdom built in the branches of the Treasure Tree Adam, a prince chained up for killing his father, and a library that survived Ohara.",
        inspiration: "Norse myth: a warrior people living in the boughs of a world tree.",
        crewJoined: [],
        keyCharacter: {
          name: "Loki",
          epithet: "The Accursed Prince",
          affiliation: "Warland Kingdom",
          bounty: 2_600_000_000,
          bountyNote: "Special bounty",
          rarity: "SEC",
          glyph: "hammer",
          palette: ["#10283a", "#7fd0c0"],
        },
      },
    ],
  },
];

export const ALL_ARCS: Arc[] = SAGAS.flatMap((saga) => saga.arcs);

/** Which arcs visit a given map location. */
export function arcsAtLocation(locationId: string): Arc[] {
  return ALL_ARCS.filter((arc) => arc.locationIds.includes(locationId));
}

/** Total number of hidden Pandamen, for the hunt counter. */
export const PANDAMAN_TOTAL = ALL_ARCS.filter((arc) => arc.pandaman).length;
