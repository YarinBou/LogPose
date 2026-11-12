/**
 * World map data.
 *
 * Names, placements and the "note" text come from the Library of Ohara interactive map
 * (https://thelibraryofohara.com/onepieceworldmap/, served from onepieceworldmap.com).
 * Coordinates are that map's own units: x grows eastward, y grows northward.
 * The world wraps: the Red Line sits at x = 33,216 (Reverse Mountain side) and again at
 * x = 1,632 / 70,368 (Mary Geoise side), so the left and right edges are the same wall.
 *
 * Spellings follow the Ohara map ("Whisky Peak", "Dress Rosa", "Elbaph", "Kaidou").
 */
import { LOCATION_INFO } from "@/data/map-details";
import { SAGAS } from "@/data/timeline";
import { slugify } from "@/lib/utils";

export type RegionId =
  | "east-blue"
  | "north-blue"
  | "west-blue"
  | "south-blue"
  | "paradise"
  | "new-world"
  | "red-line"
  | "calm-belt"
  | "sky";

export interface Region {
  id: RegionId;
  name: string;
  blurb: string;
  /** Bounding box in Ohara map units: [minX, minY, maxX, maxY]. */
  bounds: [number, number, number, number];
}

/** 1 = story landmark (always labelled), 2 = notable, 3 = minor. */
export type Tier = 1 | 2 | 3;

/** Someone who has been to a place, or is tied to it. */
export interface Visitor {
  name: string;
  kind: "crew" | "character" | "organisation";
  /** How they are connected, when they did not simply visit in the main story. */
  note?: "mentioned" | "flashback" | "anime-only";
}

export type LocationStatus = "active" | "destroyed" | "occupied" | "unknown";

/** What the land looks like. Chooses the island's colours and drawing on the map. */
export type Terrain =
  | "temperate"
  | "tropical"
  | "jungle"
  | "desert"
  | "snow"
  | "rock"
  | "urban"
  | "city"
  | "fortress"
  | "walled"
  | "haunted"
  | "mangrove"
  | "tree"
  | "candy"
  | "tech"
  | "elephant"
  | "fire-ice"
  | "sky"
  | "bubble"
  | "redline";

/**
 * Extended information about a place. Every field is optional: an entry carries only what
 * is known with confidence. Written in data/map-details.ts.
 */
export interface LocationInfo {
  /** Saga in which the place first matters, such as "Alabasta Saga". */
  saga?: string;
  /** Arc in which the place first matters. */
  arc?: string;
  /** Anime episode in which the place first appears. */
  firstAnimeEpisode?: number;
  /** Manga chapter in which the place first appears. */
  firstMangaChapter?: number;
  /** Two to four sentences: what the place is and why it matters. */
  description?: string;
  /** Short bullets of what happened there, in order. */
  keyEvents?: string[];
  visitedBy?: Visitor[];
  ruler?: string;
  affiliation?: string;
  population?: string;
  climate?: string;
  /** Notable features, separated by semicolons. */
  features?: string;
  status?: LocationStatus;
  terrain?: Terrain;
  /**
   * The latest manga chapter a reader needs to have reached for this entry to be safe.
   * The spoiler guard hides entries beyond the reader's chosen point.
   */
  spoilerLevel?: number;
}

export interface MapLocation extends LocationInfo {
  id: string;
  name: string;
  x: number;
  y: number;
  region: RegionId;
  tier: Tier;
  /** Where the Ohara map says this place sits. */
  note: string;
  /** A crew, army or company rather than a place. */
  faction: boolean;
  /** The Ohara map marks the position as unknown or approximate. */
  unplaced: boolean;
  /** Destroyed or erased in the story. */
  destroyed: boolean;
  /** Points of interest inside this location, from the Ohara map's detail maps. */
  pois: string[];
}

export interface Poneglyph {
  id: string;
  name: string;
  x: number;
  y: number;
  /** Road Poneglyphs are the four red stones that point to Laugh Tale. */
  road: boolean;
  location?: string;
  readBy?: string;
}

/* ------------------------------------------------------------------ */
/* Geometry shared by the data and the map component                    */
/* ------------------------------------------------------------------ */

export const WORLD = {
  /** Red Line, Mary Geoise side (left edge). */
  minX: 1632,
  /** Red Line, Reverse Mountain side (centre). */
  redLineX: 33216,
  /** Red Line, Mary Geoise side again (right edge). */
  maxX: 70368,
  /** South Pole. */
  minY: 3264,
  /** North Pole. */
  maxY: 47840,
  /** Outer edge of the southern Calm Belt. */
  grandLineSouth: 22300,
  /** Outer edge of the northern Calm Belt. */
  grandLineNorth: 28300,
} as const;

export const REGIONS: Region[] = [
  {
    id: "east-blue",
    name: "East Blue",
    blurb: "The weakest of the four seas, and the one where the voyage begins.",
    bounds: [WORLD.redLineX, WORLD.grandLineNorth, WORLD.maxX, WORLD.maxY],
  },
  {
    id: "north-blue",
    name: "North Blue",
    blurb: "Home of the Germa Kingdom, Flevance, and the tale of Noland the Liar.",
    bounds: [WORLD.minX, WORLD.grandLineNorth, WORLD.redLineX, WORLD.maxY],
  },
  {
    id: "west-blue",
    name: "West Blue",
    blurb: "Sea of Ohara, God Valley, and the Five Great Families.",
    bounds: [WORLD.minX, WORLD.minY, WORLD.redLineX, WORLD.grandLineSouth],
  },
  {
    id: "south-blue",
    name: "South Blue",
    blurb: "Baterilla, the Sorbet Kingdom, Karate Island, and the Torino Kingdom.",
    bounds: [WORLD.redLineX, WORLD.minY, WORLD.maxX, WORLD.grandLineSouth],
  },
  {
    id: "paradise",
    name: "Paradise",
    blurb: "The first half of the Grand Line, from Reverse Mountain to the Red Line.",
    bounds: [WORLD.redLineX, WORLD.grandLineSouth, WORLD.maxX, WORLD.grandLineNorth],
  },
  {
    id: "new-world",
    name: "New World",
    blurb: "The second half of the Grand Line, where the Emperors rule.",
    bounds: [WORLD.minX, WORLD.grandLineSouth, WORLD.redLineX, WORLD.grandLineNorth],
  },
  {
    id: "red-line",
    name: "Red Line",
    blurb: "The continent that rings the world, crossed only over Reverse Mountain or under Mary Geoise.",
    bounds: [WORLD.minX, WORLD.minY, WORLD.maxX, WORLD.maxY],
  },
  {
    id: "calm-belt",
    name: "Calm Belt",
    blurb: "Windless strips on both sides of the Grand Line, nesting ground of the Sea Kings.",
    bounds: [WORLD.minX, WORLD.grandLineSouth, WORLD.maxX, WORLD.grandLineNorth],
  },
  {
    id: "sky",
    name: "Sky",
    blurb: "Sky islands and cloud seas drifting above the Blue Sea.",
    bounds: [WORLD.minX, WORLD.minY, WORLD.maxX, WORLD.maxY],
  },
];

export function regionName(id: RegionId): string {
  return REGIONS.find((r) => r.id === id)?.name ?? id;
}

function regionFromCoordinates(x: number, y: number): RegionId {
  const west = x < WORLD.redLineX;
  if (y > 27520) return west ? "north-blue" : "east-blue";
  if (y < 22956) return west ? "west-blue" : "south-blue";
  return west ? "new-world" : "paradise";
}

/* ------------------------------------------------------------------ */
/* Raw rows: [name, x, y, note, flags]                                  */
/*   flags: 1 / 2  tier (default 3)                                     */
/*          F faction   U unplaced   X destroyed                        */
/*          R Red Line  C Calm Belt  K sky                              */
/* ------------------------------------------------------------------ */

type Raw = [name: string, x: number, y: number, note: string, flags?: string];

const RAW: Raw[] = [
  /* ---------------- East Blue ---------------- */
  ["Dawn Island", 64544, 38152, "North-Eastern East Blue", "2"],
  ["Foosha Village", 64398, 37500, "Dawn Island, East Blue", "1"],
  ["Goa Kingdom", 64620, 37860, "North-Eastern East Blue", "2"],
  ["Goat Island", 62138, 36918, "North-Eastern East Blue", "2"],
  ["Yotsuba Island", 63272, 40784, "North-Eastern East Blue", "2"],
  ["Shells Town", 60972, 38900, "Yotsuba Island, East Blue", "1"],
  ["153rd Branch", 60976, 38188, "Yotsuba Island, East Blue"],
  ["Sixis", 62752, 35072, "East Blue", "2"],
  ["Shimotsuki Village", 61639, 45012, "East Blue", "2"],
  ["Organ Archipelago", 56944, 34808, "Central East Blue", "2"],
  ["Orange Town", 57296, 34024, "Organ Archipelago, East Blue", "1"],
  ["Gecko Archipelago", 54376, 33832, "Central East Blue", "2"],
  ["Syrup Village", 53120, 32736, "Gecko Archipelago, East Blue", "1"],
  ["Kumate Island", 59584, 34244, "East Blue", "2"],
  ["Rare Animal Island", 57940, 33000, "Central East Blue", "2"],
  ["Mirrorball Island", 55700, 36309, "East Blue", "2"],
  ["Nagagutsu Kingdom", 57742, 36233, "East Blue", "2"],
  ["Conomi Archipelago", 48008, 39960, "North-Western East Blue", "2"],
  ["Arlong Park", 48804, 37574, "Conomi Archipelago, East Blue", "1"],
  ["Cocoyasi Village", 48978, 37720, "Conomi Archipelago, East Blue"],
  ["Gosa Town", 49234, 37720, "Conomi Archipelago, East Blue"],
  ["16th Branch", 47804, 38698, "East Blue"],
  ["Frauce Kingdom", 48456, 44776, "East Blue", "2"],
  ["Cozia", 41776, 39336, "East Blue", "2"],
  ["Sambas Sea Region", 48144, 32824, "South-Western East Blue", "2"],
  ["Baratie", 48172, 31000, "Sambas Sea Region, East Blue", "1"],
  ["Oykot Kingdom", 44880, 29824, "East Blue", "2"],
  ["Pole Star Archipelago", 39312, 29564, "South-Western East Blue", "2"],
  ["Loguetown", 39716, 28712, "Pole Star Archipelago, East Blue", "1"],
  ["Sahtsuruzo Kingdom", 59499, 40224, "East Blue"],
  ["Tequila Wolf", 65032, 28960, "East Blue / Paradise", "2"],
  ["77th Branch", 67136, 31288, "Unknown location", "U"],

  /* ---------------- North Blue ---------------- */
  ["Spider Miles", 12296, 40836, "North Blue", "2"],
  ["Downs", 12958, 41416, "North Blue", "2"],
  ["Rakesh", 11972, 41820, "North Blue", "2"],
  ["Whiteland Kingdom", 9335, 46120, "North Blue", "2"],
  ["Notice", 10678, 42304, "North Blue", "2"],
  ["Rubeck Island", 9744, 40800, "North Blue", "2"],
  ["Minion Island", 10860, 40194, "North Blue", "2"],
  ["Swallow Island", 10210, 39496, "North Blue", "2"],
  ["Germa Empire", 16088, 36744, "North Blue", "2"],
  ["Deul Kingdom", 18772, 36222, "North Blue", "2"],
  ["Kuen Village", 21024, 33680, "North Blue"],
  ["Flevance", 18774, 34552, "North Blue", "2X"],
  ["Micqueot", 18376, 33696, "North Blue", "2"],
  ["Lvneel Kingdom", 20416, 32096, "North Blue", "2"],
  ["Gingapore Kingdom", 13548, 37632, "Unknown location", "2U"],
  ["Pepe Kingdom", 22342, 33145, "Unknown location", "U"],
  ["Vodka Wolf", 4944, 29544, "Unknown location", "2U"],

  /* ---------------- West Blue ---------------- */
  ["Ohara", 11070, 15864, "West Blue", "1X"],
  ["God Valley", 10680, 17888, "West Blue", "2X"],
  ["Kano Country", 9984, 21280, "West Blue", "2"],
  ["Twinsnakes Island", 20638, 13740, "West Blue", "2"],
  ["Five Great Families of the West", 7679, 11449, "West Blue", "2F"],
  ["Toroa", 11864, 16528, "West Blue", "2"],
  ["Bollywood Kingdom", 9680, 15576, "West Blue", "2"],
  ["Kamigata", 4920, 16904, "West Blue", "2"],
  ["Esperia Kingdom", 5554, 8418, "West Blue", "2"],
  ["Ilisia Kingdom", 21984, 12104, "West Blue", "2"],
  ["80th Branch", 23512, 19888, "West Blue", "2"],
  ["Las Camp", 23912, 21088, "West Blue", "2"],
  ["Rum Wolf", 3544, 21752, "Unknown location", "2U"],
  ["Aspacchee", 9009, 19422, "Unknown location", "2U"],
  ["Mt. Mauri", 19664, 12736, "Unknown location", "2U"],
  ["Sankan Kingdom", 5689, 10192, "Unknown location", "2U"],
  ["Shishano Kingdom", 6983, 14529, "Unknown location", "2U"],
  ["Somewhere Kingdom", 9643, 6710, "Unknown location", "2U"],
  ["Ringo Kingdom", 12563, 14416, "Unknown location", "2U"],
  ["Czach Kingdom", 11320, 12584, "Unknown location", "2U"],
  ["Jambalaya Kingdom", 11184, 14752, "Unknown location", "2U"],
  ["Euro Peninsula", 4878, 13959, "Unknown location", "U"],
  ["Cefran Conglomerate", 22272, 9224, "Unknown location", "UF"],
  ["Enoa Academy", 5138, 19677, "Unknown location", "U"],

  /* ---------------- South Blue ---------------- */
  ["Briss Kingdom", 40456, 16664, "South Blue"],
  ["Karate Island", 41936, 16056, "South Blue", "2"],
  ["Majiatsuka Kingdom", 43320, 16672, "South Blue"],
  ["Baterilla", 44240, 19456, "South Blue", "2"],
  ["Dias", 47175, 16657, "South Blue"],
  ["Samba Kingdom", 50000, 14416, "South Blue"],
  ["Evil Black Drum Kingdom", 51864, 14696, "South Blue"],
  ["Rushwan Kingdom", 48408, 10056, "South Blue"],
  ["Sorbet Kingdom", 51096, 9648, "South Blue", "2"],
  ["Centaurea", 55232, 7464, "South Blue"],
  ["Tumi", 64616, 18792, "South Blue"],
  ["Torino Kingdom", 60363, 19720, "South Blue", "2"],
  ["Birka", 61752, 21912, "Either Paradise or South Blue", "KX"],
  ["Taya Kingdom", 49015, 11834, "South Blue", "2"],
  ["Kutsukku Island", 62719, 8608, "South Blue", "2"],
  ["Samuwanai Island", 50416, 15632, "South Blue", "2"],
  ["Vespa Kingdom Territory", 41742, 13252, "South Blue", "2"],
  ["Bourbon Wolf", 63444, 21284, "Unknown location", "2U"],
  ["Yano Country", 58524, 22504, "Unknown location", "U"],
  ["South Fire Kingdom", 66024, 19376, "Unknown location", "U"],
  ["Beef Kingdom", 57472, 7224, "Unknown location", "U"],
  ["Jewel Ice Sheet", 59104, 6576, "Unknown location", "U"],
  ["Cameron Kingdom", 66816, 10770, "Unknown location", "U"],
  ["Ice Country", 60152, 7344, "Unknown location", "U"],

  /* ---------------- Red Line ---------------- */
  ["Reverse Mountain", 34784, 27440, "Red Line", "1R"],
  ["Corkwood", 30792, 22984, "Red Line", "2R"],
  ["Sun Tree Eve", 70208, 28984, "Red Line", "2R"],
  ["Red Desert", 70208, 30000, "Red Line", "2R"],
  ["Red Port (W)", 69036, 24888, "Red Line / Paradise", "R"],
  ["Red Port (E)", 940, 24384, "Red Line / New World", "R"],
  ["Sea Trench", 70144, 24184, "Red Line / Grand Line", "R"],
  ["Holyland Mary Geoise", 70136, 25616, "Red Line", "1R"],
  ["World Govt.", 70768, 25432, "Mary Geoise, Red Line", "RF"],
  ["Fish-Man Island", 69652, 23740, "10,000 metres beneath the Red Line", "1R"],
  ["Ryugu Kingdom", 70836, 23616, "Fish-Man Island, Red Line", "R"],

  /* ---------------- Calm Belt ---------------- */
  ["Rusukaina", 61616, 23420, "Southern Paradise Calm Belt", "2C"],
  ["Ottankaina Kingdom", 61240, 23100, "Rusukaina, Southern Paradise Calm Belt", "CX"],
  ["Island of Women", 63256, 23400, "Southern Paradise Calm Belt", "1C"],
  ["Kuja Castle", 62387, 23117, "Island of Women, Calm Belt", "C"],
  ["Amazon Lily Empire", 63620, 23080, "Island of Women, Calm Belt", "C"],
  ["Impel Down", 65972, 23124, "Southern Paradise Calm Belt", "1C"],

  /* ---------------- Paradise (first half of the Grand Line) ---------------- */
  ["Twin Capes", 37204, 25988, "Red Line / Paradise", "2"],
  ["First Stretch", 38198, 25967, "Paradise"],
  ["One-Man Resort", 37767, 25017, "Paradise"],
  ["Cipher Pol Intelligence Bureau", 37366, 24002, "Unknown location", "UF"],
  ["Cactus Island", 39060, 25504, "Paradise", "2"],
  ["Whisky Peak", 38796, 25244, "Cactus Island, Paradise", "1"],
  ["Porco Kingdom", 38667, 27030, "Grand Line"],
  ["G-3 Branch", 39776, 26772, "Grand Line"],
  ["G-4 Branch", 39476, 24424, "Grand Line"],
  ["Giant Island Little Garden", 40510, 25856, "Paradise", "1"],
  ["Vira", 41080, 27176, "Paradise"],
  ["Goldfish Empire", 40968, 24468, "Paradise sea floor"],
  ["Hachimakinamazu Village", 42092, 24330, "Paradise sea floor"],
  ["Asshina Gainone Kingdom", 42308, 24794, "Unknown location", "U"],
  ["Kyuuka Island", 42628, 26636, "Paradise"],
  ["Drum Island", 43268, 25220, "Paradise", "1"],
  ["Sakura Kingdom", 43684, 24816, "Drum Island, Paradise", "2"],
  ["Marine Penitentiary", 43678, 26466, "Paradise"],
  ["Pants Hazard", 44287, 23518, "Paradise"],
  ["Boin Island Chain", 44460, 27500, "Paradise", "2"],
  ["Karakuri Island", 44633, 24543, "Paradise", "2"],
  ["Bulgemore Futuredom", 45387, 24148, "Karakuri Island, Paradise"],
  ["G-10 Branch", 45370, 25490, "Grand Line"],
  ["Shade Port", 45783, 23421, "Grand Line"],
  ["G-6 Branch", 45835, 27412, "Grand Line"],
  ["Renaisse", 45836, 26568, "Paradise"],
  ["Bourgeois Kingdom", 47772, 26840, "Paradise"],
  ["G-13 Branch", 47852, 23900, "Grand Line"],
  ["Nanimonai Island", 47968, 24660, "Paradise"],
  ["Sandy Island", 49353, 26320, "Paradise", "2"],
  ["Alabasta Kingdom", 50416, 25556, "Sandy Island, Paradise", "1"],
  ["Kenzan Island", 49932, 24016, "Paradise"],
  ["Ukkari Onsen Island", 50520, 24752, "Paradise"],
  ["Tehna Gehna Kingdom", 50652, 23612, "Kenzan Island, Paradise"],
  ["Namakura", 52070, 23706, "Paradise"],
  ["Harahettania", 52548, 23440, "Namakura island, Paradise"],
  ["Bestland Kingdom", 52188, 26484, "Unknown location", "U"],
  ["Mock Town", 52502, 25456, "Jaya, Paradise", "2"],
  ["Jaya Island", 52882, 25916, "Paradise", "1"],
  ["Rommel Kingdom", 54128, 24264, "Supposedly Paradise"],
  ["Sky Sea", 54336, 28056, "7,000 to 10,000 metres above Paradise", "2K"],
  ["Godland Skypiea", 54832, 27768, "White-White Sea, above Jaya", "1K"],
  ["Eigisu Kingdom", 55724, 23692, "Grand Line"],
  ["High West", 56208, 25296, "Unknown location", "U"],
  ["Kuraigana Island", 57122, 23850, "Paradise", "2"],
  ["Shikkeahr Kingdom", 57588, 23590, "Kuraigana Island, Paradise", "X"],
  ["G-8 Branch", 57688, 25376, "Grand Line"],
  ["Mt. Kintoki", 58109, 27395, "Grand Line"],
  ["Long Ring Long Land", 58544, 25880, "Paradise", "1"],
  ["G-11 Branch", 58879, 23970, "Grand Line"],
  ["Weatheria", 59336, 27320, "Sky island, drifting", "2K"],
  ["Lu Feld Conglomerate", 59616, 26144, "Operating worldwide", "F"],
  ["Banaro Island", 59679, 24514, "Paradise", "2"],
  ["Baltigo", 60199, 23830, "Grand Line", "2X"],
  ["St. Poplar", 60902, 24570, "Paradise"],
  ["Shift Station", 61177, 25262, "Paradise"],
  ["Pucci", 61385, 23898, "Paradise"],
  ["Shipbuilding Island", 61416, 26328, "Paradise"],
  ["Water Seven", 61696, 26148, "Shipbuilding Island, Paradise", "1"],
  ["San Faldo", 61999, 24770, "Paradise"],
  ["Guanhao", 62720, 24356, "Paradise"],
  ["Momoiro Island", 62700, 26976, "Paradise", "2"],
  ["Kamabakka Kingdom", 63392, 26708, "Momoiro Island, Paradise"],
  ["Revolutionary Army", 63433, 26274, "Operating worldwide", "F"],
  ["Florian Triangle", 64048, 25736, "Paradise", "2"],
  ["Foolshout Island", 64352, 27132, "Grand Line"],
  ["Enies Lobby", 64428, 25044, "Paradise", "1"],
  ["Thriller Bark", 65174, 25250, "Paradise, formerly West Blue", "1"],
  ["Lulusia Kingdom", 65579, 27032, "Paradise", "X"],
  ["Tarai Current", 66476, 24072, "Paradise"],
  ["Merveille", 66856, 26456, "Paradise"],
  ["G-2 Branch", 67000, 27178, "Paradise"],
  ["Sabaody Archipelago", 67884, 25784, "Paradise", "1"],
  ["Deep Sea", 68048, 23652, "Paradise"],
  ["Marineford", 68380, 24180, "Paradise", "1"],
  ["G-1 Branch", 68424, 24850, "Marineford, Paradise"],

  /* ---------------- New World (second half of the Grand Line) ---------------- */
  ["New Marineford", 1392, 25234, "New World", "2"],
  ["Marine HQ", 1924, 24824, "New Marineford, New World", "F"],
  ["Risky Red Island", 2523, 24380, "New World"],
  ["Mystoria Island", 2824, 26840, "New World"],
  ["Raijin Island", 2984, 25872, "New World"],
  ["G-5 Branch", 3563, 24088, "New World"],
  ["Punk Hazard Island", 4084, 26260, "New World", "1"],
  ["Foodvalten", 4572, 25128, "New World"],
  ["Kaidou's Darling Island", 4760, 24022, "New World"],
  ["Sea Beast Town", 5837, 24158, "New World"],
  ["Green Bit", 5984, 26216, "New World", "2"],
  ["Dress Rosa", 6420, 25644, "New World", "1"],
  ["Tontatta Kingdom", 6592, 26052, "Green Bit, New World"],
  ["Dress Rosa Kingdom", 6980, 24992, "Dress Rosa, New World"],
  ["Applenine Island", 7064, 24320, "New World"],
  ["World Economic Newspaper", 7810, 27112, "Nomad, sky", "FK"],
  ["Mogaro Kingdom", 8020, 24440, "New World"],
  ["UMIT Shipping HQ", 8800, 26632, "Unknown location", "UF"],
  ["Doerena Kingdom", 8824, 23808, "Unknown location", "U"],
  ["Ballon Terminal", 9364, 27644, "New World"],
  ["Prodence Kingdom", 9856, 24360, "New World"],
  ["Edd War", 10900, 25300, "New World", "2"],
  ["Dyed Goods Town", 11148, 26816, "Unknown location", "U"],
  ["Vodka Kingdom", 11460, 23560, "Grand Line"],
  ["Zou", 11924, 25860, "Wandering the New World", "1"],
  ["Mokomo Dukedom", 12752, 25688, "Zou, New World"],
  ["Gartel Island", 12252, 26956, "New World"],
  ["G-12 Branch", 12879, 23788, "Grand Line"],
  ["Tajine Kingdom", 13974, 25820, "Seemingly New World"],
  ["Hot Hot Sea", 14900, 24564, "Grand Line"],
  ["Standing Kingdom", 14944, 27000, "New World"],
  ["G-7 Branch", 15224, 23812, "Grand Line"],
  ["Brock Coli Island", 15532, 26096, "New World"],
  ["Big Mom Pirates", 15884, 25164, "Operating worldwide, based in Totto Land", "F"],
  ["Yari", 16397, 26924, "Supposedly New World"],
  ["Totto Land", 17820, 25664, "New World", "2"],
  ["Whole Cake Island", 17964, 24744, "Totto Land, New World", "1"],
  ["Flavor Island", 16374, 25130, "Totto Land, New World"],
  ["Package Island", 16718, 25262, "Totto Land, New World"],
  ["Jam Island", 16762, 24712, "Totto Land, New World"],
  ["Cacao Island", 16640, 24390, "Totto Land, New World"],
  ["Milk Island", 16964, 24994, "Totto Land, New World"],
  ["Kimi Island", 17094, 25262, "Totto Land, New World"],
  ["Topping Island", 16840, 25512, "Totto Land, New World"],
  ["Unique Island", 17188, 25400, "Totto Land, New World"],
  ["Liqueur Island", 17074, 24358, "Totto Land, New World"],
  ["Funwari Island", 17142, 24098, "Totto Land, New World"],
  ["Nuts Island", 17218, 24646, "Totto Land, New World"],
  ["Candy Island", 17384, 24476, "Totto Land, New World"],
  ["Biscuit Island", 17372, 25092, "Totto Land, New World"],
  ["Poripori Island", 17506, 25310, "Totto Land, New World"],
  ["Futoru Island", 17610, 25524, "Totto Land, New World"],
  ["Margarine Island", 17794, 25456, "Totto Land, New World"],
  ["Cutlery Island", 17950, 25344, "Totto Land, New World"],
  ["Jelly Island", 17658, 24114, "Totto Land, New World"],
  ["Milenge Island", 17972, 24268, "Totto Land, New World"],
  ["Rokumitsu Island", 18214, 24132, "Totto Land, New World"],
  ["Kinko Island", 18472, 24322, "Totto Land, New World"],
  ["Ice Island", 18200, 24604, "Totto Land, New World"],
  ["Fruits Island", 18230, 25036, "Totto Land, New World"],
  ["Komugi Island", 18456, 24840, "Totto Land, New World"],
  ["Potato Island", 18172, 25244, "Totto Land, New World"],
  ["Black Island", 18212, 25420, "Totto Land, New World"],
  ["Piepie Island", 18402, 25290, "Totto Land, New World"],
  ["100% Island", 18546, 25118, "Totto Land, New World"],
  ["Kibo Island", 18502, 24604, "Totto Land, New World"],
  ["Loving Island", 18750, 24252, "Totto Land, New World"],
  ["Noko Island", 18776, 24570, "Totto Land, New World"],
  ["Sanshoku Island", 18908, 24704, "Totto Land, New World"],
  ["Tanega Island", 18804, 24960, "Totto Land, New World"],
  ["Yakigashi Island", 18840, 25310, "Totto Land, New World"],
  ["Foot Colony", 17663, 27048, "Unknown location", "U"],
  ["G-9 Branch", 18051, 23860, "New World"],
  ["Kari Bari-Island", 18892, 27106, "New World", "2"],
  ["Buggy Town", 18883, 26545, "Karai Bari Island, New World"],
  ["Mirro World", 19426, 25264, "Parallel dimension"],
  ["Cross Guild", 19642, 26792, "Operating worldwide, based in Karai Bari Island", "F"],
  ["Saint Germain", 19741, 23492, "Germa Kingdom, nomad"],
  ["Germa Kingdom", 20140, 24222, "Nomad, currently New World", "2"],
  ["Punk-Records", 20319, 25552, "Sky above Egghead", "K"],
  ["Onigashima", 20859, 26786, "Wano Country, New World", "2"],
  ["Mt. Fuji", 21029, 27054, "Wano Country, New World"],
  ["Bunt Kingdom", 21035, 24004, "New World"],
  ["Future Island Egghead", 21410, 25258, "New World", "1"],
  ["Wano Country", 21447, 26855, "New World", "1"],
  ["Beasts Pirates", 22206, 26284, "Operating worldwide, formerly based in Wano", "F"],
  ["Sleepfog-Belt", 22361, 24969, "New World"],
  ["G-14 Branch", 22510, 24166, "New World"],
  ["Straw Hat Crew", 23470, 24867, "Operating worldwide, nomad", "F"],
  ["Elbaph Island", 23511, 26680, "New World", "1"],
  ["GS General Hospital", 23694, 23649, "New World"],
  ["Winner Island", 24040, 27452, "New World"],
  ["Warland Kingdom", 24374, 26281, "Elbaph Island, New World"],
  ["Pirate Island Hachinosu", 24868, 24046, "New World", "2"],
  ["Enishi", 25082, 27388, "New World"],
  ["Whitebeard Pirates", 25432, 24870, "Operating worldwide, nomad", "F"],
  ["Blackbeard Pirates", 25808, 23584, "Operating worldwide, based in Pirate Island", "F"],
  ["Aoi Kingdom", 25839, 26656, "Grand Line"],
  ["Sphinx", 26226, 25690, "New World", "2"],
  ["Yukiryu Island", 26621, 24416, "New World"],
  ["Nakrowa", 27164, 26972, "Unknown location", "U"],
  ["Red-Hair Pirates", 27581, 24176, "Operating worldwide, nomad", "F"],
  ["Emerald Capital", 28370, 26266, "Unknown location", "U"],
  ["Panda Island", 28436, 24892, "Unknown location", "U"],
  ["Lode Star Island", 29926, 25838, "The last island the Log Pose points to", "2"],
];

/** Detail-map points of interest, keyed by the id of the location they sit inside. */
const POIS: Record<string, string[]> = {
  "alabasta-kingdom": [
    "Alubarna", "Alubarna Palace", "North Block", "East Block", "South Block", "West Block",
    "Rainbase", "Yuba", "Nanohana", "Erumalu", "Katorea", "Tamarisk", "Suiren", "Baroque Works",
  ],
  "drum-island": ["Drum Castle", "Drum Rockies", "Bighorn", "Cocoa Weed", "Gyasta", "Robelle"],
  "godland-skypiea": [
    "Angel Island", "Upper Yard", "Shandora", "God's Shrine", "Heaven's Gate", "Hiddencloud Village", "Cloud End",
  ],
  "water-seven": [
    "Dock 1", "Blue Station", "Central District", "Shopping Town", "Down Town", "Chiza",
    "Scrapship Island", "Sea Train",
  ],
  "enies-lobby": [
    "Main Gate", "Main Island", "Courthouse", "Tower of Justice", "Bridge of Hesitation", "Gate of Justice",
  ],
  "thriller-bark": ["Mast Mansion", "Hogback's Mansion", "Perona's Wonder-Garden"],
  "sabaody-archipelago": [
    "Lawless Area (GR 1-29)", "Amusement Area (GR 30-39)", "Tourist Area (GR 40-49)",
    "Shipyard Area (GR 50-59)", "Marine Garrison (GR 60-69)", "Hotel District (GR 70-79)",
    "Rosy Life Riders Hideout",
  ],
  "impel-down": [
    "Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 5.5", "Level 6", "Gate of Justice",
  ],
  marineford: ["Oris Plaza", "Marineford Downtown", "G-1 Branch", "Ship Scrapyard", "Gate of Justice"],
  "fish-man-island": [
    "Ryugu Palace", "Gyoncorde Plaza", "Mermaid Cove", "Coral Hill", "Waterwheel Town",
    "Candy Factory Town", "Gyoverly Hills", "Fish-Man District", "Sea Forest", "Noa",
  ],
  "holyland-mary-geoise": [
    "Pangaea Castle", "Empty Throne Room", "Room of Flowers", "Chamber of Authority",
    "Great Conference Room", "Social Plaza", "Guard Room", "Main Gate", "Phantom Room",
    "Land of Gods", "Shangala",
  ],
  "punk-hazard-island": [
    "1st & 2nd Research Institutes", "3rd Research Institute", "Building A", "Building B",
    "Building C", "Building D", "Building R",
  ],
  "dress-rosa": [
    "Acacia", "Primula", "Sevio", "Carta", "Balsa", "Corrida Coliseum", "Royal Plateau",
    "Royal Palace", "Toys House", "SMILE Factory", "Trade Port",
  ],
  zou: ["Mokomo Dukedom", "Clou City", "Uganda", "Saganda", "Sajiri", "Sahara", "Ushilly", "Ubara"],
  "whole-cake-island": [
    "Sweet City", "Whole Cake Chateau", "Seducing Woods", "East Cove", "Fire Tank Pirates Hideout",
  ],
  "wano-country": [
    "Flower Capital", "Kuri", "Udon", "Kibi", "Ringo", "Hakumai", "Shogun Castle", "Oden Castle",
    "Ebisu Town", "Okobore Town", "Bakura Town", "Amigasa Village", "Prisoner Quarry",
    "Northern Graveyard", "Yukaku", "Rasetsu Town", "Sakyo",
  ],
  onigashima: [
    "Kaidou Manor", "Live Floor", "Left Brain Tower", "Right Brain Tower", "Frontlobe Floor",
    "Treasure Rear", "Front Gate", "Back Entrance", "Kaidou Manor Rooftop",
  ],
  "future-island-egghead": ["Labophase", "Vegapunk Labo", "Fabiriophase", "Fabirio", "Scrapyard"],
  "elbaph-island": [
    "Warland Kingdom", "Treasure Tree Adam", "Sunworld", "Underworld", "Celestialworld",
    "West Village", "Aurust Castle", "Huntsmen Village", "Brew Village", "Fishermen Village",
    "Craftsmen Village", "Haugen", "Warrior's Spring", "Owl Library", "Walrus School",
    "Block Country", "Block Castle", "Bigstein Castle", "Temple", "Facility",
  ],
};

/** Saga and arc for places the voyage visits, read from the timeline so they are stated once. */
const TIMELINE_PLACE = new Map<string, { saga: string; arc: string }>();
for (const saga of SAGAS) {
  for (const arc of saga.arcs) {
    for (const id of arc.locationIds) {
      if (!TIMELINE_PLACE.has(id)) TIMELINE_PLACE.set(id, { saga: saga.name, arc: arc.name });
    }
  }
}

function build([name, x, y, note, flags = ""]: Raw): MapLocation {
  const id = slugify(name);
  const info = LOCATION_INFO[id] ?? {};
  const destroyed = flags.includes("X") || info.status === "destroyed";
  const tier: Tier = flags.includes("1") ? 1 : flags.includes("2") ? 2 : 3;
  let region = regionFromCoordinates(x, y);
  if (flags.includes("R")) region = "red-line";
  if (flags.includes("C")) region = "calm-belt";
  if (flags.includes("K")) region = "sky";
  return {
    ...info,
    saga: info.saga ?? TIMELINE_PLACE.get(id)?.saga,
    arc: info.arc ?? TIMELINE_PLACE.get(id)?.arc,
    status: info.status ?? (destroyed ? "destroyed" : undefined),
    id,
    name,
    x,
    y,
    region,
    tier,
    note,
    faction: flags.includes("F"),
    unplaced: flags.includes("U"),
    destroyed,
    pois: POIS[id] ?? [],
  };
}

export const LOCATIONS: MapLocation[] = RAW.map(build);

// A typo in a details key would silently drop that entry, so fail loudly instead.
{
  const known = new Set(LOCATIONS.map((location) => location.id));
  const orphans = Object.keys(LOCATION_INFO).filter((id) => !known.has(id));
  if (orphans.length > 0) {
    throw new Error(`data/map-details.ts has entries for unknown locations: ${orphans.join(", ")}`);
  }
}

/** Number of places that carry a written description. */
export const DESCRIBED_COUNT = LOCATIONS.filter((location) => location.description).length;

const LOCATION_INDEX = new Map(LOCATIONS.map((l) => [l.id, l]));

export function getLocation(id: string): MapLocation | undefined {
  return LOCATION_INDEX.get(id);
}

export const PONEGLYPHS: Poneglyph[] = (
  [
    ["Ohara Poneglyph 1", 10161, 15304, false, "Ohara, West Blue", undefined],
    ["Ohara Poneglyph 2", 11771, 15297, false, "Ohara, West Blue", undefined],
    ["West Blue Poneglyph", 20312, 10664, false, "Some jungle in the West Blue", "Nico Robin"],
    ["Alabasta Poneglyph", 49680, 25944, false, "Alabasta Kingdom (Alubarna, Tomb of Kings)", "Nico Robin"],
    ["Shandora Poneglyph", 54828, 27284, false, "Upper Yard, Skypiea", "Nico Robin"],
    ["Golden Bell Poneglyph", 55388, 27582, false, "Skypiea", "Gol D. Roger and Kouzuki Oden, Nico Robin"],
    ["Sea Forest Poneglyph", 70604, 21902, false, "Ryugu Kingdom (Sea Forest)", "Gol D. Roger and Kouzuki Oden, Nico Robin"],
    ["Firescar Lode Poneglyph", 70808, 21902, true, undefined, "Unknown"],
    ["Zou Lode Poneglyph", 12174, 25770, true, "Zou (hidden chamber inside the Whale Tree)", undefined],
    ["New World Poneglyph", 13648, 27104, false, "Some jungle in the New World", "Gol D. Roger, Kouzuki Oden"],
    ["Whole Cake Poneglyph 1", 17602, 24546, false, "Whole Cake Island", "Nico Robin"],
    ["Whole Cake Poneglyph 2", 17943, 24608, false, "Whole Cake Island", "Nico Robin"],
    ["Whole Cake Island Lode Poneglyph", 17772, 24998, true, "Whole Cake Island", undefined],
    ["Onigashima Poneglyph", 20728, 26674, false, "Onigashima (2nd Basement of Kaidou Manor)", "Kouzuki Sukiyaki, Nico Robin"],
    ["Wano Country Poneglyph", 20976, 26532, false, "Wano Country (hidden room in the Shogun's Castle)", "Kouzuki Sukiyaki, Nico Robin"],
    ["Mt. Fuji Lode Poneglyph", 20928, 26038, true, "Wano Country", undefined],
    ["Hachinosu Poneglyph", 24894, 23548, false, "Pirate Island Hachinosu", "Unknown"],
  ] as [string, number, number, boolean, string | undefined, string | undefined][]
).map(([name, x, y, road, location, readBy]) => ({
  id: slugify(name),
  name,
  x,
  y,
  road,
  location,
  readBy,
}));

/**
 * The Straw Hats' course, as location ids in sailing order. The Ohara map has no route layer
 * with real data, so this follows the order of arcs on the Ohara timeline.
 * It is split in two because the world wraps at Fish-Man Island: the crew dives under the
 * Red Line on the right edge and surfaces in the New World on the left edge.
 */
export const ROUTE_PARADISE: string[] = [
  "foosha-village",
  "goat-island",
  "shells-town",
  "orange-town",
  "rare-animal-island",
  "syrup-village",
  "baratie",
  "arlong-park",
  "loguetown",
  "reverse-mountain",
  "twin-capes",
  "whisky-peak",
  "giant-island-little-garden",
  "drum-island",
  "alabasta-kingdom",
  "jaya-island",
  "godland-skypiea",
  "long-ring-long-land",
  "water-seven",
  "enies-lobby",
  "water-seven",
  "thriller-bark",
  "sabaody-archipelago",
  "fish-man-island",
];

export const ROUTE_NEW_WORLD: string[] = [
  "punk-hazard-island",
  "dress-rosa",
  "zou",
  "whole-cake-island",
  "wano-country",
  "future-island-egghead",
  "elbaph-island",
];

/** Luffy's solo detour while the crew is scattered: Sabaody to the war and back. */
export const ROUTE_SUMMIT_WAR: string[] = [
  "sabaody-archipelago",
  "island-of-women",
  "impel-down",
  "marineford",
  "island-of-women",
  "rusukaina",
  "sabaody-archipelago",
];

/** Laugh Tale is on no chart. This marker is illustrative, placed past Lode Star Island. */
export const LAUGH_TALE = { x: 31600, y: 25300 } as const;
