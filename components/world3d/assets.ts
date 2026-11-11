/**
 * The models in public/models are built in Blender by tools/blender/build_assets.py.
 * This file is the contract between that script and the scene: file paths, the names of
 * the island variants inside islands.glb, and which landmark uses which variant.
 */

export const MODEL_URLS = {
  ship: "/models/thousand-sunny.glb",
  islands: "/models/islands.glb",
  redLine: "/models/red-line.glb",
} as const;

export type IslandVariant =
  | "IslandTropical"
  | "IslandTown"
  | "IslandSnow"
  | "IslandDesert"
  | "IslandRock"
  | "IslandSky"
  | "IslandCity"
  | "IslandFortress"
  | "IslandCake"
  | "IslandWano"
  | "IslandTech"
  | "IslandTree";

/** Landmark id (data/map.ts) -> the island model that stands there. */
export const ISLAND_AT: Record<string, IslandVariant> = {
  "foosha-village": "IslandTown",
  "shells-town": "IslandFortress",
  "orange-town": "IslandTown",
  "syrup-village": "IslandTropical",
  baratie: "IslandTown",
  "arlong-park": "IslandTropical",
  loguetown: "IslandTown",
  "whisky-peak": "IslandDesert",
  "giant-island-little-garden": "IslandTropical",
  "drum-island": "IslandSnow",
  "alabasta-kingdom": "IslandDesert",
  "jaya-island": "IslandTropical",
  "godland-skypiea": "IslandSky",
  "long-ring-long-land": "IslandTropical",
  "water-seven": "IslandCity",
  "enies-lobby": "IslandFortress",
  "thriller-bark": "IslandRock",
  "sabaody-archipelago": "IslandTree",
  "island-of-women": "IslandTropical",
  "impel-down": "IslandFortress",
  marineford: "IslandFortress",
  "punk-hazard-island": "IslandRock",
  "dress-rosa": "IslandCity",
  zou: "IslandTree",
  "whole-cake-island": "IslandCake",
  "wano-country": "IslandWano",
  "future-island-egghead": "IslandTech",
  "elbaph-island": "IslandTree",
  ohara: "IslandRock",
};

/** Size of an island model on the globe: models are about 2 units across. */
export const ISLAND_SCALE = 0.16;
/** Size of the ship on the globe: the model is about 2.4 units long. */
export const SHIP_SCALE = 0.15;
